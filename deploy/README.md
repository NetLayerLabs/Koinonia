# Deploying Koinonia

The public demo runs on one Ubuntu server behind nginx. There are three parts:

- **The website:** the static build in `/opt/koinonia/dist`, served by nginx.
- **The API:** `server/index.ts` run by Node 22+ as the `koinonia` systemd service, listening only on `127.0.0.1:8795`.
- **The settings:** in `/opt/koinonia/.env.local`, readable by root only (see `.env.example`). Use:
  - `PUBLIC_DEMO=true`, for the safeguards below;
  - `DEMO_LOGIN=true`, for one-click demo accounts;
  - `ZEROG_FAST_MODEL=claude-sonnet-5.5`, for a fast meaning check;
  - `KOINONIA_API_PORT=8795`.

## First time

1. Point DNS at the server, e.g. an A record `koinonia` pointing to the server's IP.
2. Copy the code and build it (run once from your machine):
   ```bash
   deploy/deploy.sh root@SERVER
   ```
   The first run needs steps 3 to 5 before the restart can succeed.
3. Create `/opt/koinonia/.env.local` (chmod 600) with your keys and the settings above.
4. Install the service:
   ```bash
   cp deploy/koinonia.service /etc/systemd/system/
   systemctl enable --now koinonia
   ```
5. Install the site:
   ```bash
   cp deploy/nginx-koinonia.conf /etc/nginx/sites-available/koinonia.netlayerlabs.com
   ln -s /etc/nginx/sites-available/koinonia.netlayerlabs.com /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   ```
6. Add HTTPS:
   ```bash
   certbot --nginx -d koinonia.netlayerlabs.com
   ```

## Updates

```bash
deploy/deploy.sh
```

This copies the code, runs `npm ci` and `npm run build` on the server, and restarts the service. It never touches `.env.local` or `server/data`.

## Public-demo safeguards (`PUBLIC_DEMO=true`)

- **AI budgets per visitor:**
  - 6 new prayer requests with an AI summary per 10 minutes. Past that, requests are still accepted and reach the pastor; they only skip the AI step.
  - Crisis requests never count.
  - 30 meaning checks or glossary comparisons per 10 minutes.
  - 3 Sunday-notes publishes per hour.
- **No manual reset:** "Reset demo" is hidden, and `/api/reset` returns 403.
- **Nightly reset:** the data resets to clean samples at `RESET_HOUR_UTC` (default 08:00 UTC, 3 AM New York). Staff sign-ins are kept.
- **Nothing internal exposed:** the server's internal network addresses are not shown.
