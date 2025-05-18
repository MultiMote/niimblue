FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run sv-check && npm run build

FROM nginx:1.27-alpine AS server

COPY --from=builder /app/dist/ /usr/share/nginx/html/

EXPOSE 80
