#!/usr/bin/env python
"""
AutoValuate Backend Server Entry Point
Can be launched directly from any directory:
    python run_backend.py
"""

import os
import sys

# Ensure root and backend directory are in sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")
ml_dir = os.path.join(backend_dir, "ml")

for p in [root_dir, backend_dir, ml_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"[*] Starting AutoValuate Backend on http://{host}:{port} ...")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=False)
