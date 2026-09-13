# RentVerse — Token Ledger Backend (Skill Test Submission)

Backend layer for `test_project` (RentVerse): a REST API backed by a simulated
smart-contract token ledger (mint / transfer / balance). No real blockchain,
node, or web3 library involved — `ethers` stays untouched for now.

## Structure

```
server/
  server.ts
  ledger/TokenLedgerContract.ts
  ledger/types.ts
  routes/tokenRoutes.ts
  utils/storage.ts
  tsconfig.json
  data/                        created on first run

src/
  api/tokenApi.ts
  components/TokenWallet/TokenWallet.tsx

demo/standalone.html
tsconfig.json                  root config, for the CRA frontend
package.json                   merge devDependencies + scripts into yours
.env.example
```

## Setup

1. Copy these files into your fork, merging `server/` and `src/` with what's
   already there.
2. Merge `package.json` — mainly the new devDependencies (`typescript`,
   `ts-node`, `@types/*`) and the updated `start` script.
3. `npm install`
4. `cp .env.example .env`
5. `npm start` — runs the TS server via `ts-node` alongside the CRA dev server.

API base: `http://localhost:5000/api/token`

## Wiring up the frontend

```tsx
import TokenWallet from './components/TokenWallet/TokenWallet';

<Route path="/wallet" element={<TokenWallet />} />
```

Or open `demo/standalone.html` directly in a browser to hit the API without
the React app running at all — quicker for recording the demo video.

## API

| Method | Path                     | Body / Query           | Description                      |
|--------|--------------------------|--------------------------|-----------------------------------|
| GET    | `/state`                 | —                         | name, symbol, totalSupply, owner |
| GET    | `/balance/:address`      | —                         | balance for one address           |
| POST   | `/mint`                  | `{ to, amount, from? }`   | mint tokens to `to`               |
| POST   | `/transfer`              | `{ from, to, amount }`    | transfer between addresses        |
| GET    | `/transactions?address=` | optional `address`       | full or per-address history       |
| GET    | `/verify`                | —                         | checks the hash chain is intact   |

```bash
curl -X POST http://localhost:5000/api/token/mint -H "Content-Type: application/json" -d '{"to":"0xAAA","amount":100}'
curl -X POST http://localhost:5000/api/token/transfer -H "Content-Type: application/json" -d '{"from":"0xAAA","to":"0xBBB","amount":25}'
curl http://localhost:5000/api/token/balance/0xAAA
```

`TOKEN_OWNER_ADDRESS` in `.env` locks minting to one address. `ADMIN_API_KEY`
adds an `x-admin-key` header requirement on `/mint`. Both are optional.

## Checklist

- [x] New API integrated into the shared project
- [x] Token ledger simulating mint / transfer / balance, no blockchain dependency
- [x] Integrated into the frontend (TokenWallet component + typed API client)
- [ ] Record the demo video and share it with the repo link
