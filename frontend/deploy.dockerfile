FROM node:16
WORKDIR /usr/src/app
COPY . .
# COPY ./nginx.conf ./etc/nginx/nginx.conf
# RUN apt-get update -y && apt-get install nginx -y 
# RUN service nginx restart
RUN npm install --force
RUN npm run build
EXPOSE 3000
# CMD npm start
