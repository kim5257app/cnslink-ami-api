FROM node:14.17.6
MAINTAINER Jaegu Kim <kim5257.app@gmail.com>

RUN apt-get update

RUN npm install pm2 -g
RUN pm2 install pm2-logrotate

RUN mkdir /app
RUN mkdir /upload
COPY ./ /app
WORKDIR /app
RUN mkdir ./config
RUN mkdir -p /var/pm2/log

RUN yarn install

VOLUME /app/config
VOLUME /app/upload

ENTRYPOINT ["/bin/sh", "run.sh"]

EXPOSE 3000
