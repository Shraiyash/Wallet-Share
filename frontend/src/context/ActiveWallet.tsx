import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import { walletAbi } from "../config/contract";

/**
 * Which shared wallet the user is currently looking at.
 *
 * Every screen used to read one hard-coded address from env. Now a user can
 * own or belong to several wallets, so the address is runtime state — held
 * here and remembered per account, so switching accounts doesn't drop you into
 * someone else's wallet.
 */

type ActiveWalletValue = {
  activeWallet: Address | null;
  setActiveWallet: (wallet: Address | null) => void;
};

const ActiveWalletContext = createContext<ActiveWalletValue | null>(null);

const storageKey = (account: string) => `walletshare.active.${account.toLowerCase()}`;

export function ActiveWalletProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const [activeWallet, setActive] = useState<Address | null>(null);

  // Restore the last wallet this account was using, and clear it when the
  // connected account changes.
  useEffect(() => {
    if (!address) {
      setActive(null);
      return;
    }
    const stored = localStorage.getItem(storageKey(address));
    setActive(stored ? (stored as Address) : null);
  }, [address]);

  const setActiveWallet = useCallback(
    (wallet: Address | null) => {
      setActive(wallet);
      if (!address) return;
      if (wallet) localStorage.setItem(storageKey(address), wallet);
      else localStorage.removeItem(storageKey(address));
    },
    [address],
  );

  const value = useMemo(
    () => ({ activeWallet, setActiveWallet }),
    [activeWallet, setActiveWallet],
  );

  return (
    <ActiveWalletContext.Provider value={value}>{children}</ActiveWalletContext.Provider>
  );
}

export function useActiveWallet() {
  const ctx = useContext(ActiveWalletContext);
  if (!ctx) throw new Error("useActiveWallet must be used inside ActiveWalletProvider");
  return ctx;
}

/**
 * Drop-in replacement for the old `walletContract` constant:
 * `useReadContract({ ...useWalletContract(), functionName: "owner" })`.
 *
 * Returns the zero address when nothing is selected; callers should gate their
 * queries on `enabled` anyway, and the screens that render before a wallet is
 * picked never reach these hooks.
 */
export function useWalletContract() {
  const { activeWallet } = useActiveWallet();
  return useMemo(
    () =>
      ({
        address: (activeWallet ?? "0x0000000000000000000000000000000000000000") as Address,
        abi: walletAbi,
      }) as const,
    [activeWallet],
  );
}
