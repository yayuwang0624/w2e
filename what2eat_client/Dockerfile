FROM node:24-alpine

WORKDIR /what2eat_client

COPY package*.json ./
RUN npm install

CMD ["npm", "run", "build-start"]
