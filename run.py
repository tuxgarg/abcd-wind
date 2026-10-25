#!/usr/bin/env python3
import os
import sys
import subprocess
import socket
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
FRONTEND_DIST = FRONTEND_DIR / "dist"

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def check_and_build_frontend():
    if not (FRONTEND_DIST / "index.html").exists():
        print("[Build] Frontend production bundle not found. Building with npm...")
        subprocess.run(["npm", "run", "build"], cwd=str(FRONTEND_DIR), check=True)
        print("[Build] Frontend build complete.")

def find_available_port(preferred_port: int = 8080) -> int:
    for p in [preferred_port, 8080, 8000, 5000, 3001]:
        if not is_port_in_use(p):
            return p
    return preferred_port

def main():
    os.chdir(str(ROOT_DIR))
    sys.path.insert(0, str(ROOT_DIR))

    check_and_build_frontend()

    # Determine port from env or available port
    env_port = os.environ.get("PORT")
    port = int(env_port) if env_port else find_available_port(8080)

    print(f"\n==============================================================")
    print(f"🚀 GridBricks: UK Wind Day-Ahead Market Intelligence Dashboard")
    print(f"📍 Server URL: http://localhost:{port}")
    print(f"📊 Serving unified React Frontend + FastAPI Backend")
    print(f"==============================================================\n")

    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)

if __name__ == "__main__":
    main()
