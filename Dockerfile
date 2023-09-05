FROM node:18-alpine

WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY . /app
COPY --from=kernai/refinery-parent-images:v1.11.0-next /app/node_modules /app/node_modules
RUN npm run build

ENTRYPOINT /usr/local/bin/npm run start