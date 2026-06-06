# ── Build stage: produce the static production bundle ────────────────────────
FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# VITE_* are inlined into the bundle at build time. Provided via build args from
# docker-compose (see frontend.build.args). Written to .env.production so Vite
# picks them up for the production build (overrides the localhost dev .env).
ARG VITE_API_URL=https://stock-seer.com
ARG VITE_KEYCLOAK_URL=https://stock-seer.com/auth
ARG VITE_KEYCLOAK_REALM=stockseer
ARG VITE_KEYCLOAK_CLIENT_ID=stockseer-frontend
RUN printf 'VITE_API_URL=%s\nVITE_KEYCLOAK_URL=%s\nVITE_KEYCLOAK_REALM=%s\nVITE_KEYCLOAK_CLIENT_ID=%s\n' \
      "$VITE_API_URL" "$VITE_KEYCLOAK_URL" "$VITE_KEYCLOAK_REALM" "$VITE_KEYCLOAK_CLIENT_ID" \
      > .env.production

RUN npm run build

# ── Serve stage: static files via nginx with SPA fallback ────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
