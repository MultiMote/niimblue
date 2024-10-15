FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

FROM nginx:1.27-alpine AS server

COPY --from=builder /app/dist/ /usr/share/nginx/html/

EXPOSE 80