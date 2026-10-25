import math
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from backend.app.services.cache_service import (
    get_actuals_for_date,
    get_latest_forecasts_for_date,
    get_available_dates
)

def format_time_label(iso_str: str) -> str:
    """Extracts HH:MM from an ISO timestamp string."""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.strftime("%H:%M")
    except Exception:
        return iso_str[11:16] if len(iso_str) >= 16 else iso_str

def calculate_day_ahead_metrics(
    delivery_date: str,
    cutoff_hour: int = 11,
    cutoff_minute: int = 0,
    imbalance_price_gbp: float = 95.0
) -> Dict[str, Any]:
    """
    Evaluates Day-Ahead wind forecast accuracy and financial imbalance exposure
    for a given delivery date.
    
    The trading decision is assumed to be made on Day D-1 at cutoff_hour:cutoff_minute UTC
    (UK Day-Ahead Gate Closure is typically 11:00 UTC).
    
    Financial Model:
    When wind output falls short of the Day-Ahead forecast (diff < 0), the utility is
    short of energy and must settle the deficit at the UK System Buy Price (Cash-Out Penalty),
    typically averaging £75 - £150/MWh during UK winter peak periods.
    """
    deliv_dt = datetime.strptime(delivery_date, "%Y-%m-%d")
    cutoff_dt = (deliv_dt - timedelta(days=1)).replace(
        hour=cutoff_hour, minute=cutoff_minute, second=0, microsecond=0
    )
    cutoff_iso = cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    actuals = get_actuals_for_date(delivery_date)
    forecasts_map = get_latest_forecasts_for_date(delivery_date, cutoff_iso)

    periods_data = []
    abs_errors = []
    squared_errors = []
    pct_errors = []
    biases = []
    
    total_act_mwh = 0.0
    total_fc_mwh = 0.0
    total_shortfall_mwh = 0.0
    total_surplus_mwh = 0.0

    for act in actuals:
        start_time = act["startTime"]
        act_mw = float(act["generation"])
        sp = act["settlementPeriod"]
        time_label = format_time_label(start_time)

        # Match to the corresponding hour's forecast (e.g. 12:30 -> 12:00)
        hour_key = start_time[:14] + "00:00Z"
        fc_entry = forecasts_map.get(hour_key)

        if fc_entry:
            fc_mw = float(fc_entry["generation"])
            pub_time = fc_entry["publishTime"]
            has_forecast = True
        else:
            fc_mw = 0.0
            pub_time = None
            has_forecast = False

        diff_mw = act_mw - fc_mw  # positive = windfall/surplus, negative = shortfall
        bias_mw = fc_mw - act_mw  # positive = model over-forecasted, negative = under-forecasted
        abs_err = abs(diff_mw)
        sq_err = diff_mw ** 2
        pct_err = (abs_err / act_mw * 100.0) if act_mw >= 50.0 else 0.0
        
        # Financial exposure calculation per 30-min settlement period (MW * 0.5h = MWh)
        period_mwh_diff = diff_mw * 0.5
        period_penalty_gbp = 0.0

        if has_forecast:
            if period_mwh_diff < 0:
                shortfall = abs(period_mwh_diff)
                total_shortfall_mwh += shortfall
                period_penalty_gbp = shortfall * imbalance_price_gbp
            else:
                total_surplus_mwh += period_mwh_diff

            abs_errors.append(abs_err)
            squared_errors.append(sq_err)
            pct_errors.append(pct_err)
            biases.append(bias_mw)
            total_fc_mwh += (fc_mw * 0.5)

        total_act_mwh += (act_mw * 0.5)

        periods_data.append({
            "settlementPeriod": sp,
            "startTime": start_time,
            "timeLabel": time_label,
            "actualMw": round(act_mw, 1),
            "forecastMw": round(fc_mw, 1) if has_forecast else None,
            "publishTime": pub_time,
            "errorMw": round(diff_mw, 1) if has_forecast else None,
            "biasMw": round(bias_mw, 1) if has_forecast else None,
            "pctError": round(pct_err, 1) if has_forecast else None,
            "penaltyGbp": round(period_penalty_gbp, 2) if has_forecast else None,
            "status": "shortfall" if diff_mw < -200 else ("surplus" if diff_mw > 200 else "accurate")
        })

    valid_count = len(abs_errors)
    mae = (sum(abs_errors) / valid_count) if valid_count > 0 else 0.0
    rmse = math.sqrt(sum(squared_errors) / valid_count) if valid_count > 0 else 0.0
    mape = (sum(pct_errors) / valid_count) if valid_count > 0 else 0.0
    mean_bias = (sum(biases) / valid_count) if valid_count > 0 else 0.0

    # Total financial cash-out risk
    cashout_penalty_exposure_gbp = total_shortfall_mwh * imbalance_price_gbp
    # Surplus power spilled into balancing mechanism at discounted rate (~35% discount loss)
    surplus_discount_loss_gbp = total_surplus_mwh * (imbalance_price_gbp * 0.35)
    total_financial_exposure_gbp = cashout_penalty_exposure_gbp + surplus_discount_loss_gbp

    # Build 24-hour hourly aggregated summary
    hourly_data = []
    for h in range(24):
        h_str = f"{h:02d}:00"
        h_sp1 = h * 2
        h_sp2 = h * 2 + 1
        
        sp1_data = periods_data[h_sp1] if h_sp1 < len(periods_data) else None
        sp2_data = periods_data[h_sp2] if h_sp2 < len(periods_data) else None
        
        if sp1_data and sp2_data:
            avg_act = (sp1_data["actualMw"] + sp2_data["actualMw"]) / 2.0
            avg_fc = sp1_data["forecastMw"]
            diff = avg_act - avg_fc if avg_fc is not None else 0.0
            bias = avg_fc - avg_act if avg_fc is not None else 0.0
            p1_pen = sp1_data["penaltyGbp"] or 0.0
            p2_pen = sp2_data["penaltyGbp"] or 0.0
            hourly_data.append({
                "hour": h,
                "timeLabel": h_str,
                "actualMw": round(avg_act, 1),
                "forecastMw": round(avg_fc, 1) if avg_fc is not None else None,
                "errorMw": round(diff, 1) if avg_fc is not None else None,
                "biasMw": round(bias, 1) if avg_fc is not None else None,
                "penaltyGbp": round(p1_pen + p2_pen, 2)
            })

    # Risk insights with Financial impact
    recommendation = generate_trading_recommendation(
        mean_bias, mae, periods_data, total_act_mwh, total_fc_mwh,
        cashout_penalty_exposure_gbp, imbalance_price_gbp
    )

    return {
        "deliveryDate": delivery_date,
        "cutoffTime": cutoff_iso,
        "decisionDay": (deliv_dt - timedelta(days=1)).strftime("%Y-%m-%d"),
        "metrics": {
            "maeMw": round(mae, 1),
            "rmseMw": round(rmse, 1),
            "mapePct": round(mape, 1),
            "meanBiasMw": round(mean_bias, 1),
            "biasDirection": "OVER_PREDICTION" if mean_bias > 50 else ("UNDER_PREDICTION" if mean_bias < -50 else "BALANCED"),
            "totalActualMwh": round(total_act_mwh, 1),
            "totalForecastMwh": round(total_fc_mwh, 1),
            "energyVarianceMwh": round(total_act_mwh - total_fc_mwh, 1),
            "validPeriods": valid_count,
            "totalPeriods": len(actuals),
            "financial": {
                "imbalancePriceGbp": imbalance_price_gbp,
                "totalShortfallMwh": round(total_shortfall_mwh, 1),
                "totalSurplusMwh": round(total_surplus_mwh, 1),
                "cashoutPenaltyExposureGbp": round(cashout_penalty_exposure_gbp, 2),
                "surplusDiscountLossGbp": round(surplus_discount_loss_gbp, 2),
                "totalFinancialExposureGbp": round(total_financial_exposure_gbp, 2)
            }
        },
        "recommendation": recommendation,
        "periods": periods_data,
        "hourlyData": hourly_data
    }

def generate_trading_recommendation(
    mean_bias: float,
    mae: float,
    periods: List[Dict[str, Any]],
    total_act_mwh: float,
    total_fc_mwh: float,
    cashout_exposure_gbp: float,
    imbalance_price: float
) -> Dict[str, Any]:
    """
    Generates actionable business & financial insights for power procurement traders.
    """
    shortfall_periods = [p for p in periods if p["errorMw"] is not None and p["errorMw"] < -500]
    surplus_periods = [p for p in periods if p["errorMw"] is not None and p["errorMw"] > 500]
    
    formatted_gbp = f"£{cashout_exposure_gbp:,.0f}" if cashout_exposure_gbp >= 1000 else f"£{cashout_exposure_gbp:.2f}"

    if mean_bias > 300:
        headline = f"High Imbalance Risk: Systematic Over-Prediction ({formatted_gbp} Exposure)"
        badge_type = "danger"
        text = (
            f"The Day-Ahead forecast systematically over-predicted wind by an average of {round(mean_bias, 0):,} MW. "
            f"If relying entirely on this forecast, the utility under-procures thermal power by "
            f"~{abs(round(total_act_mwh - total_fc_mwh, 0)):,} MWh, exposing the trading desk to an estimated "
            f"{formatted_gbp} in UK cash-out imbalance penalties (at £{imbalance_price:0.0f}/MWh). "
            f"Recommend applying an immediate +{round(mean_bias * 0.8, 0):,} MW thermal safety hedge in Day-Ahead procurement."
        )
    elif mean_bias < -300:
        headline = "Over-Procurement Risk: Model Under-Prediction"
        badge_type = "warning"
        text = (
            f"The Day-Ahead forecast underestimated wind output by {abs(round(mean_bias, 0)):,} MW on average. "
            f"Procuring thermal generation to match this under-forecast would result in ~{abs(round(total_act_mwh - total_fc_mwh, 0)):,} MWh "
            f"of surplus power, which must be spilled into the balancing mechanism at discounted prices."
        )
    else:
        headline = "Balanced Day-Ahead Wind Forecast"
        badge_type = "success"
        text = (
            f"Day-Ahead forecast tracked actual outturn closely with a low net directional bias of {round(mean_bias, 0):,} MW "
            f"and an average error (MAE) of {round(mae, 0):,} MW. Total cash-out exposure is controlled at {formatted_gbp}. "
            f"Standard thermal procurement hedge applies."
        )

    return {
        "headline": headline,
        "badgeType": badge_type,
        "text": text,
        "financialExposureGbp": cashout_exposure_gbp,
        "criticalShortfallPeriods": [p["timeLabel"] for p in shortfall_periods[:4]],
        "criticalSurplusPeriods": [p["timeLabel"] for p in surplus_periods[:4]]
    }

def calculate_monthly_summary(
    cutoff_hour: int = 11,
    cutoff_minute: int = 0,
    imbalance_price_gbp: float = 95.0
) -> Dict[str, Any]:
    """
    Aggregates performance and financial imbalance exposure across January 2026.
    """
    available_dates = get_available_dates()
    if not available_dates:
        return {"datesCount": 0, "dailyMetrics": [], "overall": {}, "diurnalProfile": []}

    daily_results = []
    total_abs_errors = []
    total_sq_errors = []
    total_pct_errors = []
    total_biases = []
    total_act_mwh_sum = 0.0
    total_fc_mwh_sum = 0.0
    total_penalty_gbp_sum = 0.0

    # For diurnal profile (48 settlement periods)
    sp_errors: Dict[int, List[float]] = {i: [] for i in range(1, 49)}
    sp_biases: Dict[int, List[float]] = {i: [] for i in range(1, 49)}
    sp_penalties: Dict[int, List[float]] = {i: [] for i in range(1, 49)}
    sp_time_labels: Dict[int, str] = {}

    for d in available_dates:
        day_eval = calculate_day_ahead_metrics(d, cutoff_hour, cutoff_minute, imbalance_price_gbp)
        m = day_eval["metrics"]
        fin = m["financial"]
        
        daily_results.append({
            "date": d,
            "maeMw": m["maeMw"],
            "rmseMw": m["rmseMw"],
            "mapePct": m["mapePct"],
            "meanBiasMw": m["meanBiasMw"],
            "totalActualMwh": m["totalActualMwh"],
            "totalForecastMwh": m["totalForecastMwh"],
            "varianceMwh": m["energyVarianceMwh"],
            "penaltyGbp": fin["cashoutPenaltyExposureGbp"]
        })

        total_act_mwh_sum += m["totalActualMwh"]
        total_fc_mwh_sum += m["totalForecastMwh"]
        total_penalty_gbp_sum += fin["cashoutPenaltyExposureGbp"]

        for p in day_eval["periods"]:
            sp = p["settlementPeriod"]
            sp_time_labels[sp] = p["timeLabel"]
            if p["errorMw"] is not None:
                abs_e = abs(p["errorMw"])
                total_abs_errors.append(abs_e)
                total_sq_errors.append(p["errorMw"] ** 2)
                total_biases.append(p["biasMw"])
                if p["pctError"] is not None:
                    total_pct_errors.append(p["pctError"])

                sp_errors[sp].append(abs_e)
                sp_biases[sp].append(p["biasMw"])
                if p["penaltyGbp"] is not None:
                    sp_penalties[sp].append(p["penaltyGbp"])

    total_pts = len(total_abs_errors)
    ov_mae = sum(total_abs_errors) / total_pts if total_pts > 0 else 0.0
    ov_rmse = math.sqrt(sum(total_sq_errors) / total_pts) if total_pts > 0 else 0.0
    ov_mape = sum(total_pct_errors) / len(total_pct_errors) if total_pct_errors else 0.0
    ov_bias = sum(total_biases) / total_pts if total_pts > 0 else 0.0

    diurnal_profile = []
    for sp in range(1, 49):
        errs = sp_errors[sp]
        bs = sp_biases[sp]
        pens = sp_penalties[sp]
        diurnal_profile.append({
            "settlementPeriod": sp,
            "timeLabel": sp_time_labels.get(sp, f"SP{sp}"),
            "avgMaeMw": round(sum(errs) / len(errs), 1) if errs else 0.0,
            "avgBiasMw": round(sum(bs) / len(bs), 1) if bs else 0.0,
            "avgPenaltyGbp": round(sum(pens) / len(pens), 2) if pens else 0.0
        })

    sorted_by_mae = sorted(daily_results, key=lambda x: x["maeMw"])
    best_day = sorted_by_mae[0] if sorted_by_mae else None
    worst_day = sorted_by_mae[-1] if sorted_by_mae else None

    return {
        "datesCount": len(available_dates),
        "cutoffHour": cutoff_hour,
        "cutoffMinute": cutoff_minute,
        "imbalancePriceGbp": imbalance_price_gbp,
        "overall": {
            "maeMw": round(ov_mae, 1),
            "rmseMw": round(ov_rmse, 1),
            "mapePct": round(ov_mape, 1),
            "meanBiasMw": round(ov_bias, 1),
            "totalActualMwh": round(total_act_mwh_sum, 1),
            "totalForecastMwh": round(total_fc_mwh_sum, 1),
            "energyVarianceMwh": round(total_act_mwh_sum - total_fc_mwh_sum, 1),
            "totalPenaltyExposureGbp": round(total_penalty_gbp_sum, 2),
            "bestDay": best_day,
            "worstDay": worst_day
        },
        "dailyMetrics": daily_results,
        "diurnalProfile": diurnal_profile
    }
