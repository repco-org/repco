FROM node:18-slim as builder
WORKDIR /app

# stage 1: install and build
COPY package.json ./
COPY tsconfig.json ./
COPY docker/docker-init.sh ./
COPY ./packages ./packages
RUN yarn
RUN yarn build
RUN du -h --max-depth=1

# remove dev dependencies
RUN yarn install --production --ignore-scripts --prefer-offline --frozen-lockfile
RUN du -h --max-depth=1

# stage 4: setup
ENV NODE_ENV=production
CMD ["./docker-init.sh"]
