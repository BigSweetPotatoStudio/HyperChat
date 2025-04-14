FROM ubuntu:22.04

# Update package lists
RUN apt-get update

# Install curl and other dependencies
RUN apt-get install -y curl

# Add NodeSource repository for Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
# Install Node.js and npm
RUN apt-get install -y nodejs

# Install Python and pip
RUN apt-get install -y python3 python3-pip
# With pip.
RUN pip install uv

COPY ../../electron/ /root/hyperchat

ENV NODE_ENV=production

CMD ["node", "/root/hyperchat/js/main_no_electron.js"]
