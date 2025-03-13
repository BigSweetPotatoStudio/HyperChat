RELEASE=1.1.1
ARCH=linux-x64

docker build \
    --build-arg RELEASE=${RELEASE} \
    --build-arg ARCH=${ARCH} \
    -t hyperchat:${RELEASE} .
