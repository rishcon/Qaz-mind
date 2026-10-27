# Development image for QazMind Web and QazMind Admin (npm workspaces). Sources are bind-mounted by
# docker-compose.yml, so edits on the host reload in the browser. Dependencies are installed inside the image
# for Linux; the host's node_modules are never used by the container.
FROM node:22-alpine

WORKDIR /repo

COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
RUN npm ci --no-audit --no-fund

COPY packages ./packages
COPY apps/web ./apps/web
COPY apps/admin ./apps/admin

ENV DEV_HOST=0.0.0.0 \
    DEV_USE_POLLING=true

# The workspace to run is chosen by the compose service: @qazmind/web or @qazmind/admin.
CMD ["sh", "-c", "npm run dev --workspace $WORKSPACE"]
