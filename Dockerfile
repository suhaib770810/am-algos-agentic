FROM node:16-buster

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force

RUN npm install

COPY . .

CMD ["node", "am_32_algos.js"]
