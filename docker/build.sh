docker build -t hyperchat .

docker rm hyperchat && docker run --name hyperchat -p 6080:80 -v /dev/shm:/dev/shm hyperchat


docker rm hyperchat && docker run --name hyperchat -p 5901:5901 -p 6901:6901 -p 16200:16100 -v C:\\Users\\0laop\\Documents\\HyperChat:~/Documents/HyperChat -e VNC_PASSWORDLESS=true hyperchat

# docker run -it --user 0 -p 6911:6901 consol/debian-xfce-vnc