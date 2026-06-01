FROM node:24-alpine

WORKDIR /what2eat_server

COPY package*.json ./
RUN npm install

CMD ["npm", "run", "start"]
