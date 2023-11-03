FROM python:3.11-slim

WORKDIR /usr/src/app

ADD ./src ./

RUN chmod +x ./entrypoint.sh

RUN pip install pgsync==2.5.0

RUN apt update \
    && apt install -y moreutils \
    && apt install -y jq \
    && apt install -y wait-for-it

ENTRYPOINT ["bash", "./entrypoint.sh"]