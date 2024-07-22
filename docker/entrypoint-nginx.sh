#!/bin/bash
set -e

# Generate Nginx config
/generate-config.sh

# Redirect stderr to /dev/null for nginx startup
nginx -g 'daemon off;' 2>/dev/null &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?