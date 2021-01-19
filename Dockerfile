FROM node:12

WORKDIR /usr/app

COPY package*.json ./

COPY . .

RUN npm i

RUN npm run build

CMD [ "npm", "run", "start:prod" ]