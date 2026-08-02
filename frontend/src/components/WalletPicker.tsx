import { useState } from "react";
import { motion } from "framer-motion";
import { decodeEventLog } from "viem";
import { useAccount, useBalance, usePublicClient, useWriteContract } from "wagmi";
import { AppKitButton } from "@reown/appkit/react";

import { factoryAbi, factoryAddress, factoryContract } from "../config/contract";
import { useActiveWallet } from "../context/ActiveWallet";
import { useMyWallets } from "../hooks/useMyWallets";
import { RECEIPT_POLL_MS } from "../hooks/useTxAction";
import FaucetNotice from "./FaucetNotice";

/**
 * What a signed-in user sees before they are inside a wallet: the wallets they
 * belong to, and a way to start a new one.
 *
 * This is the screen that replaces the old dead end, where every visitor was
 * shown "ask the owner to invite you" because the app pointed at a single
 * hard-coded contract.
 */
export default function WalletPicker() {
  const { address } = useAccount();
  const { wallets, isPending, refetch } = useMyWallets();
  const { setActiveWallet } = useActiveWallet();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { data: balance } = useBalance({ address });

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Creating a wallet is an on-chain write, so an empty account can't do it.
  const needsGas = balance !== undefined && balance.value === 0n;

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    setError(null);
    try {
      const hash = await writeContractAsync({
        ...factoryContract,
        functionName: "createWallet",
        args: [trimmed],
      });

      // Keeps its own receipt handling — the new wallet's address is read out
      // of the logs below — but polls at the same brisk rate as every other write.
      const receipt = await publicClient!.waitForTransactionReceipt({
        hash,
        pollingInterval: RECEIPT_POLL_MS,
      });

      // Pull the new address straight out of the event rather than re-reading
      // the list and guessing which entry is the new one.
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== factoryAddress.toLowerCase()) continue;
        try {
          const decoded = decodeEventLog({
            abi: factoryAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "WalletCreated") {
            setActiveWallet(decoded.args.wallet);
            return;
          }
        } catch {
          // Not the event we're after; keep looking.
        }
      }

      await refetch();
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message.split("\n")[0] : "Could not create the wallet");
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      className="login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
    >
      <h1>Your wallets</h1>

      {isPending ? (
        <p className="hero-sub">Loading…</p>
      ) : wallets.length > 0 ? (
        <div className="wallet-list">
          {wallets.map((wallet) => (
            <button
              key={wallet.address}
              className="wallet-card"
              onClick={() => setActiveWallet(wallet.address)}
            >
              <span className="wallet-card-name">{wallet.name}</span>
              <span className="wallet-card-role">{wallet.isOwner ? "Owner" : "Member"}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="hero-sub">
          You're not in a shared wallet yet. Create one and invite the people you
          want to share it with.
        </p>
      )}

      {needsGas ? (
        <FaucetNotice address={address} action="create a wallet" />
      ) : (
        <div className="signin-panel">
          <input
            className="wallet-name-input"
            placeholder="Name your wallet — e.g. Rent House"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            maxLength={40}
          />
          <button
            className="signin-btn signin-btn--primary"
            onClick={handleCreate}
            disabled={!name.trim() || creating}
          >
            {creating ? "Creating…" : "Create a shared wallet"}
          </button>
        </div>
      )}

      {error && <p className="wallet-error">{error}</p>}

      <div style={{ marginTop: 24 }}>
        <AppKitButton balance="hide" />
      </div>
    </motion.div>
  );
}
