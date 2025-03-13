#!/bin/bash
echo "Starting HyperChat..."


docker rm hyperchat && docker run --name hyperchat -p 6080:80 -v /dev/shm:/dev/shm hyperchat


docker rm hyperchat && docker run --name hyperchat -p 5901:5901 -p 6901:6901 -p 16200:16100 -v C:\\Users\\0laop\\Documents\\HyperChat:~/Documents/HyperChat -e VNC_PASSWORDLESS=true hyperchat

# docker run -it --user 0 -p 6911:6901 consol/debian-xfce-vnc

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
