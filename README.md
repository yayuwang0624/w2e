# WHAT2EAT
<img src="WHAT2EAT.png" height="800"/>

[web](http://98.142.143.30:3000)

## [Review](http://98.142.143.30:3000/reviewtable)

## Eat out
- [ ] <2024-02-08 Thu>, st, Mr.Bro


## Docker deployment

Run everything (server, sqlite admin, client) from the repo root with Docker
Compose — no need for `node`/`npm`/`python` on the host; the images install
their own dependencies at build time.

### Prerequisites (one-time)

1. The compose file attaches to an external network named `caddy_net`
   (shared with the Caddy reverse proxy). Create it if it doesn't exist:

   ```sh
   docker network create caddy_net
   ```

2. Create a `.env` file in the repo root (it is git-ignored) for the sqlite
   admin password:

   ```sh
   echo "SQLITE_WEB_PASSWORD=change-me" > .env
   ```

### Deploy

```sh
# First deploy, or after changing any package.json:
docker compose build
docker compose up -d --renew-anon-volumes

# Normal start (reuses built images and node_modules):
docker compose up -d
```

`--renew-anon-volumes` discards the cached `node_modules` volumes so they are
repopulated from the freshly built image. Skip it for normal restarts.

### Manage

```sh
docker compose logs -f          # tail logs (add a service name to filter)
docker compose restart w2e_client
docker compose down             # stop & remove containers (data is safe: the
                                # sqlite db lives on a host bind-mount)
```

Services exposed (internally, behind Caddy): `w2e_server` :5000,
`w2e_sqlite` :4000, `w2e_client` :3000.

## Local deployment

### Server

```sh
cd what2eat_server
npm install
npm start
```

### Client

```sh
cd what2eat_client
npm install
npm start
```

#### Config
Open `/what2eat_client/src/config.ts` and update the serverIP
```js
export const Config = {
    serverIP: "${SERVER_IP}:60024"
}
```
