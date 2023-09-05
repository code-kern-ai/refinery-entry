FROM node:18-alpine

WORKDIR /app

VOLUME ["/app"]

COPY package*.json /app/

RUN npm install --also=dev

COPY --from=kernai/refinery-parent-images:v1.11.0-next /app/node_modules /app/node_modules

ENTRYPOINT /usr/local/bin/npm run dev