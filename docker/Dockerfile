FROM consol/debian-xfce-vnc
RUN wget https://github.com/BigSweetPotatoStudio/HyperChat/releases/download/v1.1.1/HyperChat-1.1.1-linux-x64.tar.gz
RUN tar -zxvf HyperChat-1.1.1-linux-x64.tar.gz
RUN rm HyperChat-1.1.1-linux-x64.tar.gz
RUN mv HyperChat-1.1.1-linux-x64 ./HyperChat
RUN chmod +x ./HyperChat/hyper-chat


RUN echo "./HyperChat/hyper-chat" >> ./wm_startup.sh
# RUN echo "chromium-browser --remote-debugging-port=9222" >> ./wm_startup.sh

CMD ["tail", "-f", "/dev/null"]

