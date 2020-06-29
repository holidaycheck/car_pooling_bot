FROM node:10.19
WORKDIR /app
COPY ./package.json /app
COPY ./.npmrc /app
RUN npm i
COPY . /app
CMD ["npm", "start"]
