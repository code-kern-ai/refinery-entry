ARG PARENT_IMAGE=dhi.io/node:20-debian12-dev

FROM ${PARENT_IMAGE}

WORKDIR /app

VOLUME ["/app"]

USER root

COPY package*.json /app/

ENV NEXT_TELEMETRY_DISABLED=1
ENV IS_DEV=1
ENV WATCHPACK_POLLING=true

RUN npm install --include=dev

ENTRYPOINT ["/usr/local/bin/npm", "run", "dev"]
