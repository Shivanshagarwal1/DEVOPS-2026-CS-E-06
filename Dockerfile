FROM node:22-alpine

WORKDIR /app

COPY src/server/package*.json /app/src/server/

RUN cd /app/src/server && npm ci --omit=dev

COPY src/ /app/src/

WORKDIR /app/src/server

EXPOSE 5000

CMD ["npm", "start"]
