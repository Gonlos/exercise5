FROM node:latest
ADD ./src /app
WORKDIR /app/databaseClient
RUN npm install
WORKDIR /app/messageAppClient
RUN npm install
WORKDIR /app/messageAppService
RUN npm install
CMD ["node","index.js"]