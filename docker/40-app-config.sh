#!/bin/sh
# Runs on every container start through the nginx image's entrypoint hooks.
# Writes the runtime facts that the static app reads from /config.json.
# The image is identical in every environment; only these two values differ.
set -eu
printf '{"environment":"%s","release":"%s"}\n' \
  "${APP_ENVIRONMENT:-unknown}" "${APP_RELEASE:-untagged}" \
  > /usr/share/nginx/html/config.json
