import { useState } from "react";
import type { Address } from "viem";

/**
 * Shown when the connected account has no Sepolia ETH.
 *
 * Signing in with Google mints an empty wallet, and every write here — creating
 * a wallet, accepting an invite — costs gas. On a testnet the honest fix is a
 * faucet. The step is deliberately only raised at the moment the user tries to
 * do something, rather than as a wall on arrival.
 */
export default function FaucetNotice({
  address,
  action,
}: {
  address?: Address;
  action: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="faucet-notice">
      <p className="hero-sub" style={{ margin: 0 }}>
        You need a little test ETH to {action}. It's free — this is a test
        network, so the funds aren't real money.
      </p>

      <code className="address-code">{address}</code>

      <div className="signin-panel" style={{ marginTop: 0 }}>
        <button className="signin-secondary" onClick={handleCopy}>
          {copied ? "Address copied" : "Copy your address"}
        </button>
        <a
          className="signin-btn signin-btn--primary"
          href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
          target="_blank"
          rel="noreferrer"
        >
          Get free test ETH
        </a>
      </div>

      <p className="signin-hint">
        Paste your address on the faucet page, then come back and refresh.
      </p>
    </div>
  );
}
