FROM node:22-bookworm-slim

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

ENV PNPM_HOME=/usr/local/bin

RUN apt-get update \
    && apt-get -y --no-install-recommends install \
        tini \
        curl \
        git \
        vim \
        openssh-client \
        procps \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/apps

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["tail", "-f", "/dev/null"]
