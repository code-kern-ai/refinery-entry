ARG DHI_NODE_BUILD=dhi.io/node:20-debian12-dev
ARG DHI_NODE_RUNTIME=dhi.io/node:20-debian12

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

# Standalone bundles its own traced node_modules (Next 12). Do not use
# hardened-images-next here: that parent pre-installs Next 15 and leaves
# extra modules under /app/node_modules, which breaks header handling at runtime.
FROM ${DHI_NODE_RUNTIME}

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=1000:1000 /app/.next/standalone ./
COPY --from=builder --chown=1000:1000 /app/public ./public
COPY --from=builder --chown=1000:1000 /app/.next/static ./.next/static

USER node

ENTRYPOINT ["node", "server.js"]
