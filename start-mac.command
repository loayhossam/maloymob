#!/bin/bash
cd "$(dirname "$0")"
(sleep 1; open http://localhost:8765/index.html 2>/dev/null || xdg-open http://localhost:8765/index.html 2>/dev/null) &
python3 -m http.server 8765 --bind 127.0.0.1
