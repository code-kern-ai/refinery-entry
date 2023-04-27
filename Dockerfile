FROM node:14-alpine as build

WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY . /app
RUN npm run build

ENTRYPOINT /usr/local/bin/npm run start