#!/bin/bash
cd "$(dirname "$0")"
PORT=8080

# If something is already running on the port, just open the browser.
if ! lsof -i ":$PORT" >/dev/null 2>&1; then
  python3 -m http.server "$PORT" >/tmp/magictouch-server.log 2>&1 &
  sleep 1
fi

open "http://localhost:$PORT/index.html"

echo "Magic Touch site is running at http://localhost:$PORT/index.html"
echo "Leave this window open while you're viewing the site."
echo "Press Ctrl+C or close this window to stop the server."
wait
