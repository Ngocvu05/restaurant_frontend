#!/bin/sh

# Health check script for nginx frontend
set -e

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx process not found"
    exit 1
fi

# Check if nginx responds to health endpoint
if ! curl -f -s --connect-timeout 5 --max-time 10 http://localhost/health > /dev/null; then
    echo "ERROR: nginx health endpoint not responding"
    exit 1
fi

# Check if main index.html is accessible
if ! curl -f -s --connect-timeout 5 --max-time 10 http://localhost/ > /dev/null; then
    echo "ERROR: main page not accessible"
    exit 1
fi

# Check if API proxy is working (optional, might fail if backend is down)
# curl -f -s --connect-timeout 2 --max-time 5 http://localhost/api/health > /dev/null || \
#     echo "WARNING: API proxy not responding (backend might be down)"

echo "OK: Frontend health check passed"
exit 0