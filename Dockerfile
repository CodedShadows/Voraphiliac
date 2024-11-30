FROM node:20.18.0
WORKDIR /usr/src/voraphiliac

COPY package*.json ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src

RUN
  --mount=type=secret,id=configFile,required=true,target=./src/configs/config.json \
  --mount=type=secret,id=responsesFile,required=true,target=./src/configs/responses.json \
  npm run build

RUN mkdir logs

CMD [ "npm", "start" ]