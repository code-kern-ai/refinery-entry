FROM node:14-alpine

WORKDIR /app

VOLUME ["/app"]

COPY package*.json /app/
ENV ORY_SDK_URL=http://localhost:4455
ENV KRATOS_BROWSER_URL=/.ory/kratos/public/

RUN npm install --also=dev

ENTRYPOINT /usr/local/bin/npm run dev