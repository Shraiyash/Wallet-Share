/**
 * Usage metrics for Wallet Share, read straight off the chain.
 *
 * Everything reported here is reconstructed from event logs the contracts have
 * been emitting since day one — nothing had to be instrumented in advance, and
 * no third-party analytics service is involved. That also means it costs
 * nothing to run and has no monthly event cap to grow out of.
 *
 *   npm run analytics              summary table
 *   npm run analytics -- --csv     also writes analytics-output/*.csv
 *
 * Env:
 *   ANALYTICS_RPC_URL   Sepolia endpoint. Defaults to a public node, on
 *                       purpose: the project's Alchemy key is domain-locked to
 *                       the Vercel origin and returns 403 to anything calling
 *                       from Node, so the .env RPC does NOT work here.
 *   FACTORY_ADDRESS     Overrides deployments/sepolia.json.
 *   FROM_BLOCK          Skips the deployment-block search.
 */

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

const DEFAULT_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

/** Public nodes cap `eth_getLogs` ranges; this backs off on rejection. */
const INITIAL_CHUNK = 10_000;
const MIN_CHUNK = 500;

/** Wallet addresses per getLogs call, so the filter never gets too large. */
const ADDRESS_BATCH = 100;

const factoryAbi = [
  "event WalletCreated(address indexed wallet, address indexed owner, string name)",
  "event MembershipChanged(address indexed wallet, address indexed member, bool allowed)",
];

const walletAbi = [
  "event Deposit(address indexed sender, uint amount)",
  "event FundsTransferred(address indexed to, uint amount)",
];

type Row = { log: ethers.Log; parsed: ethers.LogDescription };

async function main() {
  const wantCsv = process.argv.includes("--csv");
  const rpcUrl = process.env.ANALYTICS_RPC_URL ?? DEFAULT_RPC;
  const factory = (process.env.FACTORY_ADDRESS ?? readDeployedAddress()).toLowerCase();

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const head = await provider.getBlockNumber();

  console.log(`\nWallet Share — on-chain usage`);
  console.log(`factory  ${factory}`);
  console.log(`rpc      ${rpcUrl}`);
  console.log(`head     block ${head.toLocaleString()}\n`);

  const start = process.env.FROM_BLOCK
    ? Number(process.env.FROM_BLOCK)
    : await findDeploymentBlock(provider, factory, head);
  console.log(`scanning from block ${start.toLocaleString()} …\n`);

  // --- factory events: who exists at all -----------------------------------
  const factoryIface = new ethers.Interface(factoryAbi);
  const factoryLogs = await getLogsChunked(provider, [factory], start, head);
  const factoryRows = parseAll(factoryIface, factoryLogs);

  const created = factoryRows.filter((r) => r.parsed.name === "WalletCreated");
  const membership = factoryRows.filter((r) => r.parsed.name === "MembershipChanged");

  const wallets = created.map((r) => ({
    address: (r.parsed.args.wallet as string).toLowerCase(),
    owner: (r.parsed.args.owner as string).toLowerCase(),
    name: r.parsed.args.name as string,
    block: r.log.blockNumber,
  }));

  // --- wallet events: who actually uses it ---------------------------------
  const walletIface = new ethers.Interface(walletAbi);
  const walletAddresses = wallets.map((w) => w.address);
  const walletLogs = walletAddresses.length
    ? await getLogsChunked(provider, walletAddresses, start, head)
    : [];
  const walletRows = parseAll(walletIface, walletLogs);

  const deposits = walletRows.filter((r) => r.parsed.name === "Deposit");
  const transfers = walletRows.filter((r) => r.parsed.name === "FundsTransferred");

  // Timestamps come from the blocks that actually contain events, cached, so
  // a quiet month costs nothing to report on.
  const times = await blockTimes(
    provider,
    [...factoryRows, ...walletRows].map((r) => r.log.blockNumber),
  );
  const at = (block: number) => times.get(block) ?? 0;

  const now = Math.floor(Date.now() / 1000);
  const DAY = 86_400;

  // Membership is append-only in the factory index and can be revoked, so the
  // current roster is the *last* event per (wallet, member) — not a count of
  // MembershipChanged events, which would double-count anyone re-added.
  const current = new Map<string, boolean>();
  for (const r of membership) {
    const wallet = (r.parsed.args.wallet as string).toLowerCase();
    const member = (r.parsed.args.member as string).toLowerCase();
    current.set(`${wallet}:${member}`, r.parsed.args.allowed as boolean);
  }
  const activeMemberships = [...current.entries()].filter(([, allowed]) => allowed);

  // An owner is a user even if they never appear in MembershipChanged.
  const people = new Set<string>(wallets.map((w) => w.owner));
  for (const [key] of activeMemberships) people.add(key.split(":")[1]);

  const actedSince = (cutoff: number) => {
    const who = new Set<string>();
    for (const r of deposits) {
      if (at(r.log.blockNumber) >= cutoff) who.add((r.parsed.args.sender as string).toLowerCase());
    }
    for (const w of wallets) {
      if (at(w.block) >= cutoff) who.add(w.owner);
    }
    return who;
  };

  const walletsActiveSince = (cutoff: number) => {
    const who = new Set<string>();
    for (const r of walletRows) {
      if (at(r.log.blockNumber) >= cutoff) who.add(r.log.address.toLowerCase());
    }
    return who;
  };

  const sum = (rows: Row[], since = 0) =>
    rows
      .filter((r) => at(r.log.blockNumber) >= since)
      .reduce((total, r) => total + (r.parsed.args.amount as bigint), 0n);

  // --- report --------------------------------------------------------------
  const firstBlock = wallets.length ? Math.min(...wallets.map((w) => w.block)) : 0;

  section("Users");
  line("Wallets created", wallets.length);
  line("Unique owners", new Set(wallets.map((w) => w.owner)).size);
  line("People with access", people.size, "owners + current members");
  line("Active memberships", activeMemberships.length, "excludes revoked");

  section("Activity");
  line("Active addresses (7d)", actedSince(now - 7 * DAY).size);
  line("Active addresses (30d)", actedSince(now - 30 * DAY).size);
  line("Active wallets (7d)", walletsActiveSince(now - 7 * DAY).size);
  line("Active wallets (30d)", walletsActiveSince(now - 30 * DAY).size);

  section("Money");
  line("Deposits", `${deposits.length} totalling ${eth(sum(deposits))} ETH`);
  line("  last 30d", `${eth(sum(deposits, now - 30 * DAY))} ETH`);
  line("Transfers out", `${transfers.length} totalling ${eth(sum(transfers))} ETH`);
  line("  last 30d", `${eth(sum(transfers, now - 30 * DAY))} ETH`);

  section("Growth — wallets created per week");
  const byWeek = new Map<string, number>();
  for (const w of wallets) {
    const t = at(w.block);
    if (t) byWeek.set(weekOf(t), (byWeek.get(weekOf(t)) ?? 0) + 1);
  }
  if (byWeek.size === 0) console.log("  (no wallets yet)");
  for (const [week, n] of [...byWeek.entries()].sort()) {
    console.log(`  ${week}  ${"█".repeat(Math.min(n, 40))} ${n}`);
  }

  if (firstBlock) {
    console.log(`\nfirst wallet created ${new Date(at(firstBlock) * 1000).toISOString()}`);
  }

  if (wantCsv) {
    const dir = path.join(process.cwd(), "analytics-output");
    fs.mkdirSync(dir, { recursive: true });

    const memberCount = (wallet: string) =>
      activeMemberships.filter(([key]) => key.startsWith(`${wallet}:`)).length;
    const depositedInto = (wallet: string) =>
      sum(deposits.filter((r) => r.log.address.toLowerCase() === wallet));

    writeCsv(
      path.join(dir, "wallets.csv"),
      ["wallet", "owner", "name", "created_at", "block", "active_members", "deposited_eth"],
      wallets.map((w) => [
        w.address,
        w.owner,
        w.name,
        iso(at(w.block)),
        w.block,
        memberCount(w.address),
        eth(depositedInto(w.address)),
      ]),
    );

    writeCsv(
      path.join(dir, "events.csv"),
      ["timestamp", "block", "event", "wallet", "address", "amount_eth"],
      [...factoryRows, ...walletRows]
        .sort((a, b) => a.log.blockNumber - b.log.blockNumber)
        .map((r) => {
          const args = r.parsed.args as unknown as Record<string, unknown>;
          const wallet = (args.wallet as string) ?? r.log.address;
          const who = (args.owner ?? args.member ?? args.sender ?? args.to ?? "") as string;
          const amount = args.amount as bigint | undefined;
          return [
            iso(at(r.log.blockNumber)),
            r.log.blockNumber,
            r.parsed.name,
            wallet.toLowerCase(),
            who ? who.toLowerCase() : "",
            amount === undefined ? "" : eth(amount),
          ];
        }),
    );

    console.log(`\nwrote analytics-output/wallets.csv and events.csv`);
  }

  console.log("");
}

/**
 * Where to start scanning, found by bisecting on block *timestamps* against the
 * recorded deploy time.
 *
 * The obvious approach — bisect on `eth_getCode` until the contract appears —
 * does not work here: public RPC nodes are pruned and reject historical state
 * with "historical state is not available". Block headers are kept by every
 * node, so timestamps are the one thing that can be queried at any height
 * without an archive endpoint.
 */
async function findDeploymentBlock(
  provider: ethers.JsonRpcProvider,
  address: string,
  head: number,
) {
  process.stdout.write("locating deployment block… ");

  // Latest state is always available, so this still catches a wrong address.
  if ((await provider.getCode(address, "latest")) === "0x") {
    throw new Error(`no contract at ${address} on this network`);
  }

  const deployedAt = readDeployedAt();
  if (!deployedAt) {
    console.log("unknown — set FROM_BLOCK to narrow the scan");
    return 0;
  }

  let low = 0;
  let high = head;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const block = await provider.getBlock(mid);
    if (block && block.timestamp < deployedAt) low = mid + 1;
    else high = mid;
  }

  // A margin, because the recorded timestamp is when the script wrote the file
  // rather than when the block sealed, and the two can differ by a block or two.
  const from = Math.max(0, low - 50);
  console.log(`block ${from.toLocaleString()}`);
  return from;
}

/**
 * getLogs across a range that no public node will serve in one call. The chunk
 * halves itself whenever a node rejects the span, so this adapts to whatever
 * endpoint it is pointed at instead of hard-coding one provider's limit.
 */
async function getLogsChunked(
  provider: ethers.JsonRpcProvider,
  addresses: string[],
  from: number,
  to: number,
): Promise<ethers.Log[]> {
  const out: ethers.Log[] = [];

  for (let i = 0; i < addresses.length; i += ADDRESS_BATCH) {
    const batch = addresses.slice(i, i + ADDRESS_BATCH);
    let cursor = from;
    let chunk = INITIAL_CHUNK;

    while (cursor <= to) {
      const end = Math.min(cursor + chunk - 1, to);
      try {
        const logs = await provider.getLogs({
          address: batch.length === 1 ? batch[0] : batch,
          fromBlock: cursor,
          toBlock: end,
        });
        out.push(...logs);
        cursor = end + 1;
        progress(cursor, to);
      } catch (err) {
        if (chunk <= MIN_CHUNK) throw err;
        chunk = Math.max(MIN_CHUNK, Math.floor(chunk / 2));
      }
    }
  }

  if (process.stdout.isTTY) process.stdout.write(`\r${" ".repeat(24)}\r`);
  return out;
}

/** Block timestamps for only the blocks that matter, fetched a few at a time. */
async function blockTimes(provider: ethers.JsonRpcProvider, blocks: number[]) {
  const unique = [...new Set(blocks)];
  const times = new Map<number, number>();
  const CONCURRENCY = 8;

  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const slice = unique.slice(i, i + CONCURRENCY);
    const fetched = await Promise.all(slice.map((b) => provider.getBlock(b)));
    fetched.forEach((block, j) => {
      if (block) times.set(slice[j], block.timestamp);
    });
  }
  return times;
}

function parseAll(iface: ethers.Interface, logs: ethers.Log[]): Row[] {
  const rows: Row[] = [];
  for (const log of logs) {
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed) rows.push({ log, parsed });
    } catch {
      // A wallet emits events this script doesn't model (AccessSet,
      // InviteAccepted). Skipping them is expected, not an error.
    }
  }
  return rows;
}

function deployment(): Record<string, string> | null {
  const file = path.join(process.cwd(), "deployments", "sepolia.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

function readDeployedAddress(): string {
  const record = deployment();
  if (!record?.address) {
    throw new Error("deployments/sepolia.json missing — set FACTORY_ADDRESS instead");
  }
  return record.address;
}

/** Unix seconds of the recorded deploy, or null if the file predates the field. */
function readDeployedAt(): number | null {
  const iso = deployment()?.deployedAt;
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

function writeCsv(file: string, header: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  fs.writeFileSync(file, `${body}\n`);
}

const eth = (wei: bigint) => Number(ethers.formatEther(wei)).toFixed(4);
const iso = (t: number) => (t ? new Date(t * 1000).toISOString() : "");
const weekOf = (t: number) => {
  const d = new Date(t * 1000);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString().slice(0, 10);
};

const section = (title: string) => console.log(`\n${title}\n${"─".repeat(46)}`);
const line = (label: string, value: string | number, note = "") =>
  console.log(`  ${label.padEnd(24)} ${String(value).padStart(10)}${note ? `   ${note}` : ""}`);

// Carriage-return progress only makes sense on a terminal; piped to a file or
// through `tail` it just accumulates "scanning 99%scanning 100%" noise.
const progress = (done: number, total: number) => {
  if (!process.stdout.isTTY) return;
  process.stdout.write(`\rscanning ${Math.min(100, Math.floor((done / total) * 100))}%`);
};

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
