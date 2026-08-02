import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useDisconnect, useReadContract } from "wagmi";
import type { Address } from "viem";
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiCheck,
  FiChevronDown,
  FiCopy,
  FiExternalLink,
  FiLogOut,
  FiRefreshCw,
  FiRepeat,
  FiSettings,
} from "react-icons/fi";

import { walletAbi } from "../config/contract";
import { appKitNetwork } from "../config/wagmi";

type Props = {
  activeWallet: Address;
  isOwner: boolean;
  /** Full-precision ether string, straight from `formatEther`. */
  balance: string;
  /** Epoch ms of the last confirmed read, from React Query. */
  balanceUpdatedAt: number;
  isBalanceFetching: boolean;
  onRefreshBalance: () => void;
  onSwitchWallet: () => void;
};

/** Which popover is showing — only ever one. */
type Panel = null | "balance" | "settings";

/**
 * Balance readout and account menu for the nav bar.
 *
 * The two are kept deliberately separate. The balance opens onto money — what
 * you have, how fresh the figure is, and the two things anyone would want to do
 * about it. The gear opens onto the account — which wallet this is and how to
 * leave it. Nothing appears in both: an action that lives in one panel is
 * absent from the other, so there is never a question of which copy to use.
 */
export default function WalletMenu({
  activeWallet,
  isOwner,
  balance,
  balanceUpdatedAt,
  isBalanceFetching,
  onRefreshBalance,
  onSwitchWallet,
}: Props) {
  const [panel, setPanel] = useState<Panel>(null);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();

  const { data: walletName } = useReadContract({
    address: activeWallet,
    abi: walletAbi,
    functionName: "name",
  });

  const explorer = appKitNetwork.blockExplorers?.default?.url;

  // A menu that traps you until you find the trigger again is worse than no
  // menu: clicking anywhere else or pressing Escape closes it.
  useEffect(() => {
    if (!panel) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setPanel(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panel]);

  const toggle = (next: Exclude<Panel, null>) =>
    setPanel((current) => (current === next ? null : next));

  const go = (path: string) => {
    setPanel(null);
    navigate(path);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeWallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="wallet-menu" ref={rootRef}>
      {/* The pill used to refresh silently on click — a real action with no
          label, on a control that reads like a label. It now opens a panel that
          names everything it can do. */}
      <button
        className={panel === "balance" ? "wallet-balance-pill is-open" : "wallet-balance-pill"}
        onClick={() => toggle("balance")}
        aria-haspopup="menu"
        aria-expanded={panel === "balance"}
        aria-label="Wallet balance and funds"
      >
        <span className="wallet-balance-value">{formatBalance(balance)}</span>
        <span className="wallet-balance-unit">ETH</span>
        <FiChevronDown className="wallet-balance-caret" aria-hidden="true" />
      </button>

      <button
        className={panel === "settings" ? "wallet-gear wallet-gear--open" : "wallet-gear"}
        onClick={() => toggle("settings")}
        aria-haspopup="menu"
        aria-expanded={panel === "settings"}
        aria-label="Wallet settings"
      >
        <FiSettings aria-hidden="true" />
      </button>

      {/* `mode="wait"`: both sheets are absolutely positioned in the same spot,
          so the default sync behaviour cross-fades them on top of each other and
          you briefly see two stacked panels when switching. Waiting for the exit
          costs ~0.16s and is the difference between a swap and a smear. */}
      <AnimatePresence mode="wait">
        {panel === "balance" && (
          <Sheet key="balance">
            <div className="wallet-sheet-hero">
              <span className="wallet-sheet-label">Wallet balance</span>
              <div className="wallet-sheet-figure">
                {balance} <span>ETH</span>
              </div>
              <div className="wallet-sheet-fresh">
                {isBalanceFetching ? "Checking…" : `Updated ${sinceLabel(balanceUpdatedAt)}`}
              </div>
            </div>

            <div className="wallet-sheet-actions">
              <button className="wallet-action" role="menuitem" onClick={() => go("/deposit")}>
                <FiArrowDownLeft aria-hidden="true" />
                Add funds
              </button>

              <button className="wallet-action" role="menuitem" onClick={() => go("/transfer")}>
                <FiArrowUpRight aria-hidden="true" />
                Send funds
              </button>

              {/* The old hidden click, now labelled. Deliberately the only copy
                  in the app — the settings panel does not repeat it. */}
              <button
                className="wallet-action"
                role="menuitem"
                onClick={onRefreshBalance}
                disabled={isBalanceFetching}
              >
                <FiRefreshCw
                  aria-hidden="true"
                  className={isBalanceFetching ? "wallet-icon-spin" : undefined}
                />
                {isBalanceFetching ? "Refreshing…" : "Refresh balance"}
              </button>

              {explorer && (
                <a
                  className="wallet-action"
                  role="menuitem"
                  href={`${explorer}/address/${activeWallet}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FiExternalLink aria-hidden="true" />
                  Transaction history
                </a>
              )}
            </div>
          </Sheet>
        )}

        {panel === "settings" && (
          <Sheet key="settings">
            <div className="wallet-sheet-head">
              <div className="wallet-sheet-name">
                {(walletName as string) || "Shared wallet"}
              </div>
              <div className="wallet-sheet-meta">
                <code>{shorten(activeWallet)}</code>
                <span className="wallet-role">{isOwner ? "Owner" : "Member"}</span>
              </div>
            </div>

            <div className="wallet-sheet-actions">
              <button className="wallet-action" role="menuitem" onClick={handleCopy}>
                {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
                {copied ? "Copied" : "Copy wallet address"}
              </button>

              <button
                className="wallet-action"
                role="menuitem"
                onClick={() => {
                  setPanel(null);
                  onSwitchWallet();
                }}
              >
                <FiRepeat aria-hidden="true" />
                Switch wallet
              </button>

              <div className="wallet-sheet-divider" />

              <button
                className="wallet-action wallet-action--danger"
                role="menuitem"
                onClick={() => {
                  setPanel(null);
                  disconnect();
                }}
              >
                <FiLogOut aria-hidden="true" />
                Sign out
              </button>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </div>
  );
}

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="wallet-sheet"
      role="menu"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Four decimals on the bar — enough to see a test transfer land, short enough
 * that the pill doesn't resize as the number changes. The exact figure is in
 * the panel.
 */
function formatBalance(eth: string) {
  const n = Number(eth);
  if (!Number.isFinite(n)) return eth;
  if (n === 0) return "0";
  // Rounding a real balance to "0.0000" would read as an empty wallet.
  if (n < 0.0001) return "<0.0001";
  return n.toFixed(4).replace(/\.?0+$/, "");
}

/** "just now" / "2m ago" — enough to answer "is this number current?". */
function sinceLabel(updatedAt: number) {
  if (!updatedAt) return "never";
  const seconds = Math.floor((Date.now() - updatedAt) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

const shorten = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
