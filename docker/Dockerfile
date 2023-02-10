FROM node:18-slim as builder

WORKDIR /app
COPY . .

# install and build
RUN yarn
RUN yarn build
RUN du -h --max-depth=1

# remove dev dependencies
RUN yarn install --production --ignore-scripts --prefer-offline --frozen-lockfile
RUN du -h --max-depth=1

ENV PATH="${PATH}:/app/node_modules/.bin"

# setup
ENV NODE_ENV=production
CMD ["./docker-init.sh"]
