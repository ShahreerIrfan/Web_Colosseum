# Dokploy Deployment Guide (Web_Colosseum - Docker Build)

## 1. Create Application in Dokploy
- **Provider**: GitHub (`ShahreerIrfan/Web_Colosseum`)
- **Branch**: `main`
- **Build Path**: `/`
- **Build Type**: **Dockerfile**
  - **Docker File**: `Dockerfile`
  - **Docker Context Path**: `.`
  - **Docker Build Stage**: leave empty

## 2. Expose Without a Domain (VPS IP + Port, e.g. `8080`) or With a Domain
- **Without a Domain** (`Advanced -> Ports -> Add Port`):
  - **Published Port**: e.g. `8080` (any free port on your VPS; remember `sudo ufw allow 8080/tcp`)
  - **Target Port**: `80` (Nginx listens on port `80` inside the container)
  - **Protocol**: `TCP`
- **With a Domain** (`Domains` tab):
  - Point your domain (or Dokploy `Generate Domain`) to **Container Port**: `80`.

## 3. Environment Variables (`Environment` tab)
Runtime variables are injected into `/env-config.js` at container startup, so updating them and clicking **Redeploy** takes effect immediately:

```env
VITE_BACKEND_URL=http://187.126.3.18:9000/api/v1
VITE_FRONTEND_URL=http://187.126.3.18:8080
VITE_PRIVACY_OPERATOR=
VITE_PRIVACY_CONTACT_EMAIL=
```

## 4. Health Check
- Path: `/health` (returns HTTP `200 ok`)
- SPA deep links (`/login`, `/admin`, etc.) automatically fall back to `/index.html` via Nginx.
