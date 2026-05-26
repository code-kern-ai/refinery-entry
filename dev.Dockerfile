ARG DHI_NODE_BUILD=dhi.io/node:20-debian12-dev
FROM ${DHI_NODE_BUILD}

WORKDIR /app

VOLUME ["/app"]

USER root

COPY package*.json /app/

ENV NEXT_TELEMETRY_DISABLED=1
ENV IS_DEV=1
ENV WATCHPACK_POLLING=true

RUN npm install --include=dev

USER 65532:65532

ENTRYPOINT ["/usr/local/bin/npm", "run", "dev"]
