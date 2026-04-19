# Park City Site

Single-VPS deployment for the public marketing site, blog, FAQ, and a basic admin dashboard.

## Stack

- `frontend/`: React + Vite app for the public site and `/admin`
- `backend/`: FastAPI app with CRUD endpoints
- `alembic`: explicit schema migrations for blog/FAQ tables
- `postgres`: PostgreSQL in Docker with a named volume
- host `nginx`: TLS termination, reverse proxy, and basic auth for admin routes

## Local structure

- [docker-compose.yml](docker-compose.yml)
- [deploy.sh](deploy.sh)
- [ops/nginx/site.conf](ops/nginx/site.conf)

## One-time setup on the VPS

1. Copy `.env.example` to `.env` and set a real `POSTGRES_PASSWORD`.
2. Create the admin password file on the host:

```bash
sudo htpasswd -c /etc/nginx/.parkcity-admin admin
```

3. Issue a certificate before exposing the admin surface. With Certbot standalone:

```bash
sudo certbot certonly --standalone -d example.com -d www.example.com
```

4. Install the nginx site config from [ops/nginx/site.conf](/Users/nhulston/Dev/nhulston.github.io/ops/nginx/site.conf), update `server_name`, and replace the certificate paths if your domain differs:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Deploy

```bash
./deploy.sh
```

The deploy script now rebuilds images, waits for Postgres, runs `alembic upgrade head`, and then starts the app containers.

## nginx expectations

- Only host nginx is public, and it should terminate HTTPS on `443`.
- Docker publishes frontend/backend only to `127.0.0.1`.
- `/admin` and `/api/admin/` are protected by basic auth.
- The backend trusts admin requests only when nginx sends `X-Admin-User: admin`.
