FROM node:14.18.0-alpine

RUN apk update && apk add --no-cache --virtual .build-deps make gcc g++ python

WORKDIR /app
EXPOSE 3000

COPY package.json .
COPY yarn.lock .

RUN npm install

COPY package* ./
RUN npm ci \
 && apk del .build-deps

COPY . .

ENV NODE_ENV=development
CMD ["npm", "run", "start:dev"]
