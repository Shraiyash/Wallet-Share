import { useState } from "react";
import { useAccount, useChainId, useReadContract, useSignTypedData } from "wagmi";
import type { Address } from "viem";

import { useWalletContract } from "../context/ActiveWallet";

const INVITE_VALID_DAYS = 7;

/**
 * Generates a bearer invite link, signed off-chain by the owner.
 *
 * Signing costs nothing and takes no transaction, so an owner can hand out
 * invites instantly. The person receiving it doesn't have to send their address
 * over first — they just open the link and join, which is what makes this feel
 * like a normal invite rather than a crypto handshake.
 */
export default function InviteLink() {
  const walletContract = useWalletContract();
  const { address } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();

  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: owner } = useReadContract({
    ...walletContract,
    functionName: "owner",
  });

  const isOwner =
    Boolean(owner && address) &&
    (owner as Address).toLowerCase() === (address as Address).toLowerCase();

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const inviteId = `0x${Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}` as `0x${string}`;

      const expiry = BigInt(
        Math.floor(Date.now() / 1000) + INVITE_VALID_DAYS * 24 * 60 * 60,
      );

      const signature = await signTypedDataAsync({
        domain: {
          name: "WalletShare",
          version: "1",
          chainId,
          verifyingContract: walletContract.address,
        },
        types: {
          Invite: [
            { name: "wallet", type: "address" },
            { name: "inviteId", type: "bytes32" },
            { name: "expiry", type: "uint256" },
          ],
        },
        primaryType: "Invite",
        message: {
          wallet: walletContract.address,
          inviteId,
          expiry,
        },
      });

      const url = new URL("/join", window.location.origin);
      url.searchParams.set("wallet", walletContract.address);
      url.searchParams.set("id", inviteId);
      url.searchParams.set("exp", expiry.toString());
      url.searchParams.set("sig", signature);
      setLink(url.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message.split("\n")[0] : "Could not create the invite");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!isOwner) return null;

  return (
    <div className="section invite-section">
      <h3>Invite someone</h3>
      <p className="invite-hint">
        Creates a link anyone can use once to join this wallet. No transaction,
        no fee — it expires after {INVITE_VALID_DAYS} days.
      </p>

      {link ? (
        <>
          <code className="invite-link">{link}</code>
          <div className="signin-panel">
            <button className="signin-btn signin-btn--primary" onClick={handleCopy}>
              {copied ? "Link copied" : "Copy invite link"}
            </button>
            <button className="signin-secondary" onClick={() => setLink(null)}>
              Create another
            </button>
          </div>
        </>
      ) : (
        <button
          className="signin-btn signin-btn--primary"
          onClick={handleCreate}
          disabled={busy}
        >
          {busy ? "Waiting for signature…" : "Create invite link"}
        </button>
      )}

      {error && <p className="wallet-error">{error}</p>}
    </div>
  );
}
