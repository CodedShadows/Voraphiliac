FROM node:19.7.0
WORKDIR /usr/src/voraphiliac
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install
RUN npm run build
FROM node:19.7.0
WORKDIR /usr/src/voraphiliac
COPY package*.json ./
RUN npm install --only=production
COPY --from=0 /usr/src/voraphiliac/dist .
CMD [ "npm", "start" ]