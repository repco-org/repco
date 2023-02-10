FROM alpine as base

RUN apk add --update nodejs yarn
WORKDIR /app

FROM base as builder
COPY . .
# install and build
RUN yarn
RUN yarn build
# remove dev dependencies again
RUN yarn install --production --ignore-scripts --prefer-offline --frozen-lockfile

FROM base
COPY --from=builder /app /app
# setup
ENV PATH="${PATH}:/app/node_modules/.bin"
ENV NODE_ENV=production
CMD ["/app/docker/docker-init.sh"]
