FROM node:23-alpine3.20
LABEL authors="xbeef"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3005

RUN npx prisma generate


RUN npm run build

CMD ["npm", "run", "start:prod"]
