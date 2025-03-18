FROM consol/debian-xfce-vnc

ARG RELEASE=1.1.1
ARG ARCH=linux-x64

ENV RELEASE=${RELEASE}
ENV ARCH=${ARCH}

RUN wget https://github.com/BigSweetPotatoStudio/HyperChat/releases/download/v${RELEASE}/HyperChat-${RELEASE}-${ARCH}.tar.gz
RUN tar -zxvf HyperChat-${RELEASE}-${ARCH}.tar.gz
RUN rm HyperChat-${RELEASE}-${ARCH}.tar.gz
RUN mv HyperChat-${RELEASE}-${ARCH} ./HyperChat
RUN chmod +x ./HyperChat/hyper-chat


RUN echo "\n" >> wm_startup.sh
RUN echo "nohup ./HyperChat/hyper-chat &" >> wm_startup.sh
# RUN echo "nohup chromium --remote-debugging-port=9222 &" >> wm_startup.sh
RUN echo "nohup firefox -marionette -start-debugger-server 2828 &" >> wm_startup.sh

CMD ["tail", "-f", "/dev/null"]
