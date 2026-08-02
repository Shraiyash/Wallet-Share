import { useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useAccount, useBalance, usePublicClient, useReadContracts, useWriteContract } from "wagmi";
import type { Address } from "viem";

import { walletAbi } from "../config/contract";
import { useActiveWallet } from "../context/ActiveWallet";
import { RECEIPT_POLL_MS } from "../hooks/useTxAction";
import FaucetNotice from "./FaucetNotice";

/**
 * Landing spot for an invite link: /join?wallet=…&id=…&exp=…&sig=…
 *
 * The signature in the URL is the owner's off-chain authorisation. Redeeming it
 * is the invitee's own transaction, which is why the faucet step can appear
 * here too.
 */
export default function JoinInvite({ onDone }: { onDone: () => void }) {
  const [params] = useSearchParams();
  const { address, isConnected } = useAccount();
  const { setActiveWallet } = useActiveWallet();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { data: balance } = useBalance({ address });

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wallet = params.get("wallet") as Address | null;
  const inviteId = params.get("id") as `0x${string}` | null;
  const expiryRaw = params.get("exp");
  const signature = params.get("sig") as `0x${string}` | null;

  const malformed = !wallet || !inviteId || !expiryRaw || !signature;
  const expiry = expiryRaw ? BigInt(expiryRaw) : 0n;
  const expired = !malformed && expiry < BigInt(Math.floor(Date.now() / 1000));

  const { data: details } = useReadContracts({
    contracts: wallet
      ? [
          { address: wallet, abi: walletAbi, functionName: "name" } as const,
          { address: wallet, abi: walletAbi, functionName: "inviteUsed", args: [inviteId!] } as const,
        ]
      : [],
    query: { enabled: Boolean(wallet) && !malformed },
  });

  const walletName = (details?.[0]?.result as string | undefined) ?? "this wallet";
  const alreadyUsed = details?.[1]?.result as boolean | undefined;
  const needsGas = balance !== undefined && balance.value === 0n;

  const handleJoin = async () => {
    if (malformed || joining) return;
    setJoining(true);
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: wallet!,
        abi: walletAbi,
        functionName: "acceptInvite",
        args: [inviteId!, expiry, signature!],
      });
      await publicClient!.waitForTransactionReceipt({
        hash,
        pollingInterval: RECEIPT_POLL_MS,
      });
      setActiveWallet(wallet!);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message.split("\n")[0] : "Could not join this wallet");
    } finally {
      setJoining(false);
    }
  };

  const body = () => {
    if (malformed) {
      return <p className="hero-sub">This invite link is incomplete. Ask for a fresh one.</p>;
    }
    if (expired) {
      return <p className="hero-sub">This invite has expired. Ask the owner for a new link.</p>;
    }
    if (alreadyUsed) {
      return <p className="hero-sub">This invite has already been used. Ask for a fresh one.</p>;
    }
    if (!isConnected) {
      return <p className="hero-sub">Sign in first and this link will let you straight in.</p>;
    }
    if (needsGas) {
      return <FaucetNotice address={address} action="join this wallet" />;
    }
    return (
      <div className="signin-panel">
        <button
          className="signin-btn signin-btn--primary"
          onClick={handleJoin}
          disabled={joining}
        >
          {joining ? "Joining…" : `Join ${walletName}`}
        </button>
        <button className="signin-secondary" onClick={onDone}>
          Not now
        </button>
      </div>
    );
  };

  return (
    <motion.div
      className="login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
    >
      <h1>You've been invited</h1>
      <p className="hero-sub">
        Someone wants to share <strong>{walletName}</strong> with you.
      </p>
      {body()}
      {error && <p className="wallet-error">{error}</p>}
    </motion.div>
  );
}
