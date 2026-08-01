import { useAccount, useReadContract, useReadContracts } from "wagmi";
import type { Address } from "viem";
import { factoryContract, walletAbi } from "../config/contract";

export type WalletSummary = {
  address: Address;
  name: string;
  isOwner: boolean;
};

/**
 * The wallets this account can actually open.
 *
 * The factory's index is append-only — membership can be revoked without the
 * entry being removed, because deleting from a Solidity array costs far more
 * gas than letting the client filter. So we take the candidate list from the
 * factory and confirm each one on-chain before showing it.
 */
export function useMyWallets() {
  const { address } = useAccount();

  const {
    data: candidates,
    isPending: listPending,
    isError: listError,
    refetch,
  } = useReadContract({
    ...factoryContract,
    functionName: "getWallets",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const addresses = (candidates ?? []) as readonly Address[];

  // One multicall for name/owner/isAllowed across every candidate.
  const {
    data: details,
    isPending: detailsPending,
    isError: detailsError,
  } = useReadContracts({
    contracts: addresses.flatMap((wallet) => [
      { address: wallet, abi: walletAbi, functionName: "name" } as const,
      { address: wallet, abi: walletAbi, functionName: "owner" } as const,
      { address: wallet, abi: walletAbi, functionName: "isAllowed", account: address } as const,
    ]),
    query: { enabled: Boolean(address) && addresses.length > 0 },
  });

  const wallets: WalletSummary[] = [];
  if (details) {
    addresses.forEach((wallet, i) => {
      const name = details[i * 3]?.result as string | undefined;
      const owner = details[i * 3 + 1]?.result as Address | undefined;
      const allowed = details[i * 3 + 2]?.result as boolean | undefined;

      const isOwner = Boolean(owner && address && owner.toLowerCase() === address.toLowerCase());
      // Revoked members stay in the factory index, so filter them out here.
      if (!isOwner && !allowed) return;

      wallets.push({ address: wallet, name: name || "Untitled wallet", isOwner });
    });
  }

  const isPending = listPending || (addresses.length > 0 && detailsPending);

  return {
    wallets,
    isPending,
    isError: listError || detailsError,
    hasNone: !isPending && addresses.length === 0,
    refetch,
  };
}
