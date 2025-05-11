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

RUN npm i -g @dadigua/hyper-chat

ENV NODE_ENV=production

# Set up a new user named "user" with user ID 1000
RUN useradd -m -u 1000 user

# Switch to the "user" user
USER user

# Set home to the user's home directory
ENV HOME=/home/user \
	PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

CMD ["npx", "hyper-chat", "--appDataDir=/home/user/app/HyperChat"]