FROM consol/debian-xfce-vnc


RUN wget https://github.com/BigSweetPotatoStudio/HyperChat/releases/download/v1.1.1/HyperChat-1.1.1-linux-x64.tar.gz
RUN tar -zxvf HyperChat-1.1.1-linux-x64.tar.gz
RUN rm HyperChat-1.1.1-linux-x64.tar.gz
RUN mv HyperChat-1.1.1-linux-x64 ./HyperChat
RUN chmod +x ./HyperChat/hyper-chat



# RUN echo "123">> 123.txt
# RUN echo "456">> 123.txt
# RUN cp wm_startup.sh wm_startup_bak.sh
# RUN echo "echo 123" >> wm_startup.sh
RUN echo "\n" >> wm_startup.sh
RUN echo "nohup ./HyperChat/hyper-chat &" >> wm_startup.sh
# RUN echo "nohup chromium --remote-debugging-port=9222 &" >> wm_startup.sh
RUN echo "nohup firefox -marionette -start-debugger-server 2828 &" >> wm_startup.sh

CMD ["tail", "-f", "/dev/null"]

