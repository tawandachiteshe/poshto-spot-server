# poshto-spot-server

Backend for a pay-per-voucher Wi-Fi hotspot. A customer buys a voucher code, types it into the
[captive portal](https://github.com/tawandachiteshe/captive-portal), and gets online until the
voucher runs out of data, time or days.

```
phone ──> hotspot router (CoovaChilli) ──> captive portal (Next.js)
                │                                 │
                │ RADIUS auth + accounting        │ voucher check
                ▼                                 ▼
           FreeRADIUS ──── PostgreSQL ──── poshto-spot-server (NestJS)
```

FreeRADIUS and this API share one PostgreSQL database. The API writes RADIUS rows
(`radcheck`, `radreply`) when it creates a voucher, and reads `radacct` to see how much each
voucher has used.

## How a voucher works

1. **Create:** `POST /vouchers` with `{ "gb": 2, "price": 1, "expireDays": 7 }`, or
   `POST /create-batch` to print a batch. The API stores the voucher and writes its password,
   `Session-Timeout` and `ChilliSpot-Max-Total-Octets` for FreeRADIUS.
2. **First login:** the portal calls `GET /check?code=…`, which records the first use and starts
   the expiry clock.
3. **Enforce:** three jobs run every 10 minutes and add `Auth-Type := Reject` for any voucher that
   has used its data cap, passed its expiry date or used up its session time.

Other endpoints: `GET /sessions` (who is online now), `GET /my-usage?x-user=…` (a customer's own
usage) and `GET /dashboard` (sales and usage totals for the admin page).

## Run it

You need Node 18+, Docker and PostgreSQL.

```sh
echo 'DATABASE_URL=postgresql://user:pass@localhost:5432/radius' > .env
yarn install
npx prisma migrate deploy
yarn start:dev                    # http://localhost:3005

docker network create dokploy-network                # the compose file expects it
docker compose -f radius/docker-compose.yml up -d   # FreeRADIUS on UDP 1812/1813
```

Point FreeRADIUS at the same database (`radius/raddb/mods-enabled/sql`) and add your hotspot
router to `radius/raddb/clients.conf`.

## Stack

NestJS 11, Prisma, PostgreSQL, FreeRADIUS 3.2, `@nestjs/schedule`, Docker, deployed with Dokploy
behind Traefik.
