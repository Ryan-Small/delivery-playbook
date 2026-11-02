# Build once. The image carries build-time facts (commit, build time) and
# nothing that names an environment. Environment and release name are read
# at container start by docker/40-app-config.sh. See docs/release-and-promotion.md.

FROM node:25-alpine AS build
ARG APP_COMMIT=local
ARG APP_BUILD_TIME=unknown
WORKDIR /src
COPY app/package.json app/package-lock.json ./app/
RUN cd app && npm ci
COPY app ./app
COPY docs ./docs
ENV APP_COMMIT=$APP_COMMIT
ENV APP_BUILD_TIME=$APP_BUILD_TIME
RUN cd app && npm run build

FROM nginx:1.29-alpine
COPY --from=build /src/app/dist /usr/share/nginx/html
COPY docker/40-app-config.sh /docker-entrypoint.d/40-app-config.sh
RUN chmod +x /docker-entrypoint.d/40-app-config.sh
EXPOSE 80
