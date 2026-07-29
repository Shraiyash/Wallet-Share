import { useState } from "react";
import { motion } from "framer-motion";
import { parseEther, formatEther, BaseError } from "viem";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import CustomAlert from "./CustomAlert";
import { walletContract } from "../config/contract";
import type { AlertData } from "../types";

function Deposit() {
  const [depositAmount, setDepositAmount] = useState("");
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [hasDeposited, setHasDeposited] = useState(false);

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  // Per-user deposit total, read straight from the chain and cached by
  // React Query. `refetch` runs after a successful deposit.
  const { data: userDepositTotal, refetch } = useReadContract({
    ...walletContract,
    functionName: "userDeposits",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  async function handleDeposit() {
    if (!depositAmount) return;
    try {
      const hash = await writeContractAsync({
        ...walletContract,
        functionName: "deposit",
        value: parseEther(depositAmount),
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      setAlertData({ message: "Deposit successful!", type: "success" });
      if (!hasDeposited) setHasDeposited(true);
      setDepositAmount("");
      refetch();
    } catch (err) {
      const message = err instanceof BaseError ? err.shortMessage : "Deposit failed!";
      setAlertData({ message, type: "failure" });
    }
  }

  const formattedTotal = userDepositTotal ? formatEther(userDepositTotal) : "0.0";

  const animationProps = {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
    transition: { delay: 0.2, duration: hasDeposited ? 1.0 : 0.5, ease: "easeInOut" as const },
  };

  return (
    <div className="deposit-page-container">
      {alertData && (
        <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
      )}
      <div className="deposit-left">
        <h1>Deposit money into the Wallet</h1>
        <div className="total-deposit">
          <motion.div key={formattedTotal} {...animationProps} className="total-deposit">
            <h3>Total Money Deposited: {formattedTotal}</h3>
          </motion.div>
        </div>
      </div>
      <div className="deposit-right">
        <motion.img
          src="/deposit-new.gif"
          alt="Deposit Animation"
          style={{ width: "250px", height: "250px", marginBottom: "20px" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: "easeInOut" }}
        />
        <h2>Deposit Funds</h2>
        <div className="glass-container">
          <input
            className="glass-input"
            type="number"
            placeholder="Amount in ETH"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <button onClick={handleDeposit} disabled={isPending}>
            {isPending ? "Depositing…" : "Deposit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Deposit;
