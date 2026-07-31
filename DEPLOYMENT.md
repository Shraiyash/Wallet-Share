# Deploying Wallet Share to Sepolia + Vercel

This guide takes the app from local Ganache to a live public deployment:
the **contract on Sepolia** (deployed by you, locally) and the **frontend on
Vercel** (a free `*.vercel.app` URL).

> **Security model:** your `PRIVATE_KEY` is used **only** on your machine by
> Hardhat to deploy the contract. It never goes into the frontend, into Git, or
> into Vercel. Vercel only receives the public `VITE_*` values.

---

## 1. Deploy the contract to Sepolia (local, one time)

### a. Create the root `.env`
```bash
cp .env.example .env
```
Fill it in:
- `SEPOLIA_RPC_URL` — a free Sepolia HTTPS URL from
  [Alchemy](https://dashboard.alchemy.com) (Create App → Sepolia) or
  [Infura](https://app.infura.io).
- `PRIVATE_KEY` — the key of the MetaMask account holding your Sepolia test ETH
  (MetaMask → Account details → Show private key). This account becomes the
  contract **owner**.
- `ETHERSCAN_API_KEY` — optional, only for source verification.

### b. Deploy
```bash
npm run compile
npm run deploy:sepolia
```
This prints — and saves to `deployments/sepolia.json` — the deployed **address**.
Example output:
```
✅ SmarContracttWallet deployed
   Network : sepolia (chainId 11155111)
   Address : 0xABC...123
   Saved   : deployments/sepolia.json
👉 Put these in frontend/.env (local dev) AND in the Vercel dashboard:
   VITE_CONTRACT_ADDRESS=0xABC...123
   VITE_CHAIN_ID=11155111
```

### c. (Optional) verify on Etherscan
```bash
npx hardhat verify --network sepolia 0xABC...123
```

---

## 2. Point the frontend at Sepolia (local test first)

```bash
cd frontend
cp .env.example .env
```
In `frontend/.env` set:
```
VITE_CONTRACT_ADDRESS=<address from step 1b>
VITE_CHAIN_ID=11155111
VITE_RPC_URL=<your Sepolia RPC URL>
VITE_WALLETCONNECT_PROJECT_ID=<from https://cloud.walletconnect.com>
```
Then run it and switch MetaMask to the **Sepolia** network:
```bash
npm run dev
```

---

## 3. Deploy the frontend to Vercel (free URL)

The Vercel project root is the **`frontend/`** folder.

```bash
cd frontend
npx vercel            # first run: log in + link the project (preview URL)
npx vercel --prod     # promote to the production *.vercel.app URL
```

### Environment variables to add in Vercel
Vercel will prompt during `vercel`, or add them under
**Project → Settings → Environment Variables** (then redeploy). These are the
**only** vars Vercel needs — all public, all `VITE_`-prefixed:

| Key | Value |
|-----|-------|
| `VITE_CONTRACT_ADDRESS` | deployed Sepolia address from step 1b |
| `VITE_CHAIN_ID` | `11155111` |
| `VITE_RPC_URL` | your Sepolia RPC URL |
| `VITE_WALLETCONNECT_PROJECT_ID` | your WalletConnect project id |

> ⚠️ Do **not** add `PRIVATE_KEY` or `SEPOLIA_RPC_URL` (the root `.env` ones) to
> Vercel. The frontend never deploys contracts.

If you set the vars via the dashboard after the first deploy, run
`npx vercel --prod` once more so the build picks them up (Vite bakes env at
build time).

### Lock the RPC URL to your domain
`VITE_RPC_URL` is baked into the JS bundle, so anyone can read your Alchemy key
out of the deployed site and spend your request quota. The key can't be hidden —
restrict where it works instead:

Alchemy dashboard → your app → **Security** → add your deployed origin (e.g.
`https://smart-wallet-wheat.vercel.app`) under allowed domains/referrers. Once a
domain allowlist exists, requests from anywhere else are rejected.

Add `http://localhost:5173` too, or local dev will start failing.

---

## Switching back to local Ganache
Just change `frontend/.env` back to:
```
VITE_CONTRACT_ADDRESS=0x85d17a400bEF4A86eab9A35baa8a814727EDb164
VITE_CHAIN_ID=1337
VITE_RPC_URL=http://127.0.0.1:7545
```
No code changes — the network is entirely env-driven.
