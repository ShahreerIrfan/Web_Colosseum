# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

ARG VITE_BACKEND_URL=http://187.126.3.18:9000/api/v1
ARG VITE_FRONTEND_URL=
ARG VITE_PRIVACY_OPERATOR=
ARG VITE_PRIVACY_CONTACT_EMAIL=

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL \
    VITE_FRONTEND_URL=$VITE_FRONTEND_URL \
    VITE_PRIVACY_OPERATOR=$VITE_PRIVACY_OPERATOR \
    VITE_PRIVACY_CONTACT_EMAIL=$VITE_PRIVACY_CONTACT_EMAIL

RUN npm run build

# Production static Nginx stage
FROM nginx:1.27-alpine AS runner

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-env-config.sh && \
    chmod +x /docker-entrypoint.d/40-env-config.sh

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
