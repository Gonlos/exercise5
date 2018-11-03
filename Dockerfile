FROM node:latest
ADD ./src /app
WORKDIR /app/messageAppService
RUN npm install
CMD ["node","index.js"]