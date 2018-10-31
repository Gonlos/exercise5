FROM node:latest
ADD ./serviceMessageApp /app
WORKDIR /app
RUN npm install
CMD ["node","index.js"]