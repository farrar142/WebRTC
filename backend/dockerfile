FROM python:3.10-alpine

WORKDIR /usr/src/app

COPY . .

RUN apk update \
    && apk add --virtual build-deps gcc python3-dev musl-dev libc-dev  graphviz-dev libffi-dev\
    && apk add --no-cache mariadb-dev
RUN pip3 install -r requirements.txt
RUN apk del build-deps
RUN apk add graphviz