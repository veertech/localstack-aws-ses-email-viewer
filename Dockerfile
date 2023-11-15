FROM node:18.18.2-alpine

WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3005
CMD ["node", "index.js"]
