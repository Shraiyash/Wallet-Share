import { useState } from "react";
import { motion } from "framer-motion";
import { parseEther, isAddress, BaseError } from "viem";
import { useWriteContract, usePublicClient } from "wagmi";
import CustomAlert from "./CustomAlert";
import { walletContract } from "../config/contract";
import type { AlertData } from "../types";

function SetLimit() {
  const [limitAddress, setLimitAddress] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [alertData, setAlertData] = useState<AlertData | null>(null);

  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  async function handleSetLimit() {
    if (!isAddress(limitAddress)) {
      setAlertData({ message: "Please enter a valid address.", type: "failure" });
      return;
    }
    if (!limitAmount) return;
    try {
      // The limit is stored in the SAME unit transferFunds compares against.
      // Transfer.tsx sends parseEther(amount) (wei), so the limit is parseEther'd
      // too — otherwise a limit of "1" would mean 1 wei and every real transfer
      // would revert with "Transfer Limit Exceeded".
      const hash = await writeContractAsync({
        ...walletContract,
        functionName: "setLimit",
        args: [limitAddress, parseEther(limitAmount)],
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      setAlertData({ message: "Limit set successfully!", type: "success" });
      setLimitAddress("");
      setLimitAmount("");
    } catch (err) {
      const message = err instanceof BaseError ? err.shortMessage : "Setting limit failed!";
      setAlertData({ message, type: "failure" });
    }
  }

  return (
    <div className="set-limit-container">
      {alertData && (
        <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
      )}
      <div className="set-limit-left">
        <h1>Set a transfer limit for each user</h1>
      </div>
      <div className="set-limit-right">
        <motion.img
          src="/set-limit.gif"
          alt="Set Limit Animation"
          style={{ width: "150px", height: "150px", marginBottom: "20px" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: "easeInOut" }}
        />
        <h2>Set Transfer Limit</h2>
        <div className="glass-container">
          <input
            className="glass-input"
            type="text"
            placeholder="Address"
            value={limitAddress}
            onChange={(e) => setLimitAddress(e.target.value)}
          />
          <input
            className="glass-input"
            type="number"
            placeholder="Limit Amount in ETH"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
          />
          <button onClick={handleSetLimit} disabled={isPending}>
            {isPending ? "Setting…" : "Set Limit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SetLimit;
