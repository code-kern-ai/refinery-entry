FROM node:14-alpine

WORKDIR /app

VOLUME ["/app"]

COPY package*.json /app/

RUN npm install --also=dev

ENTRYPOINT /usr/local/bin/npm run dev