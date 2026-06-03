ARG PARENT_IMAGE=registry.dev.kern.ai/code-kern-ai/refinery-parent-images:hardened-images-next
ARG DHI_NODE_BUILD=dhi.io/node:20-debian12-dev

FROM ${DHI_NODE_BUILD} AS builder

WORKDIR /app

COPY package*.json ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install && npm cache clean --force

COPY pages ./pages
COPY pkg ./pkg
COPY util ./util
COPY styles ./styles
COPY i18n ./i18n
COPY public ./public
COPY submodules ./submodules
COPY next.config.js .
COPY tsconfig.json .
COPY postcss.config.js .
COPY tailwind.config.js .

RUN npm run build

FROM ${PARENT_IMAGE}

WORKDIR /app

COPY --from=builder --chown=65532:65532 /app/.next/standalone ./
COPY --from=builder --chown=65532:65532 /app/public ./public
COPY --from=builder --chown=65532:65532 /app/.next/static ./.next/static

USER node

ENTRYPOINT ["node", "server.js"]
