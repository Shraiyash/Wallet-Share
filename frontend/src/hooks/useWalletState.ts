import { useAccount, useBalance, useReadContract, useWatchContractEvent } from "wagmi";
import { formatEther } from "viem";
import { walletContract, contractAddress } from "../config/contract";

/**
 * Central hook for the connected user's relationship to the wallet contract.
 *
 * The contract balance is fetched once and then refetched only when a Deposit
 * or FundsTransferred event fires — no more `setInterval` polling every 2s.
 */
export function useWalletState() {
  const { address, isConnected } = useAccount();

  const {
    data: balance,
    refetch: refetchBalance,
  } = useBalance({ address: contractAddress });

  const { data: ownerAddress } = useReadContract({
    ...walletContract,
    functionName: "owner",
  });

  const { data: isOwner } = useReadContract({
    ...walletContract,
    functionName: "isOwner",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  // isAllowed() reads msg.sender, so the call must originate from the
  // connected account.
  const { data: isAllowed } = useReadContract({
    ...walletContract,
    functionName: "isAllowed",
    account: address,
    query: { enabled: Boolean(address) },
  });

  // Event-driven balance refresh (replaces the old polling interval).
  useWatchContractEvent({
    ...walletContract,
    eventName: "Deposit",
    onLogs: () => refetchBalance(),
  });
  useWatchContractEvent({
    ...walletContract,
    eventName: "FundsTransferred",
    onLogs: () => refetchBalance(),
  });

  return {
    address,
    isConnected,
    ownerAddress: ownerAddress as `0x${string}` | undefined,
    isOwner: Boolean(isOwner),
    isAllowed: Boolean(isAllowed),
    contractBalance: balance ? formatEther(balance.value) : "0",
    refetchBalance,
  };
}
