FROM node:12-alpine

RUN mkdir /app
WORKDIR /app

COPY package.json /app
RUN npm install

COPY . /app

EXPOSE 1234

CMD ["npm", "start"]
