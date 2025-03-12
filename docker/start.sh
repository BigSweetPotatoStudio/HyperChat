#!/bin/bash
echo "Starting HyperChat..."

# # Start the VNC server if it's not running
# if [ ! -e /tmp/.X1-lock ]; then
#     /usr/bin/vncserver :1 -geometry 1280x800 -depth 24
# fi

# Wait for X server to be ready
# echo "Waiting for X server to be ready..."
# until xdpyinfo -display :1 >/dev/null 2>&1; do
#     sleep 0.5
# done
# echo "X server is ready"

# # Export display for GUI applications
# export DISPLAY=:1

# # Run HyperChat
# echo "Starting HyperChat..."
# /root/HyperChat/hyper-chat --no-sandbox

# Keep container running
