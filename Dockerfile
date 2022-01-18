FROM node:17

COPY . /app
WORKDIR /app

RUN npm install

CMD ["node", "main.js"]