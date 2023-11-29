FROM node:18.18.2-alpine3.18 AS build-env
COPY . /app
WORKDIR /app

RUN npm ci --omit=dev

FROM gcr.io/distroless/nodejs18-debian12
COPY --from=build-env /app /app
WORKDIR /app
CMD ["server.js"]
