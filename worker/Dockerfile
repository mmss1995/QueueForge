FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
COPY api/package.json ./api/
COPY worker/package.json ./worker/
COPY shared/package.json ./shared/

RUN yarn install --frozen-lockfile

COPY shared ./shared
COPY worker ./worker

WORKDIR /app/worker

CMD ["yarn", "start"]