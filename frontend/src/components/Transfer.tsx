import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { parseEther, isAddress, BaseError } from "viem";
import { useWriteContract, usePublicClient } from "wagmi";
import CustomAlert from "./CustomAlert";
import { walletContract } from "../config/contract";
import type { AlertData } from "../types";

type Props = {
  contractBalance: string;
};

function Transfer({ contractBalance }: Props) {
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [alertData, setAlertData] = useState<AlertData | null>(null);

  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const imageControls = useAnimation();

  useEffect(() => {
    async function sequence() {
      await imageControls.start({
        opacity: 1,
        y: 0,
        transition: { delay: 0.3, duration: 1, ease: "easeInOut" },
      });
      imageControls.start({
        y: [0, -2, -4, -5, -4, -2, 0, 2, 4, 5, 4, 2, 0],
        transition: { duration: 5, repeat: Infinity, ease: "linear" },
      });
    }
    sequence();
  }, [imageControls]);

  async function handleTransfer() {
    if (!isAddress(transferTo)) {
      setAlertData({ message: "Please enter a valid recipient address.", type: "failure" });
      return;
    }
    if (!transferAmount) return;
    try {
      const hash = await writeContractAsync({
        ...walletContract,
        functionName: "transferFunds",
        args: [transferTo, parseEther(transferAmount)],
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      setAlertData({ message: "Transfer Successful!", type: "success" });
      setTransferTo("");
      setTransferAmount("");
    } catch (err) {
      const message = err instanceof BaseError ? err.shortMessage : "Transfer failed!";
      setAlertData({ message, type: "failure" });
    }
  }

  const animationProps = {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
    transition: { delay: 0.2, duration: 1.0, ease: "easeInOut" as const },
  };

  return (
    <div className="transfer-container">
      {alertData && (
        <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
      )}
      <div className="transfer-left">
        <h1>Transfer money across the world</h1>
        <div className="transfer-curr-bal">
          <motion.h3 key={contractBalance} {...animationProps} className="transfer-curr-bal">
            Current Wallet Balance: {contractBalance} ETH
          </motion.h3>
        </div>
      </div>
      <div className="transfer-right">
        <motion.img
          src="/transfer-10.png"
          alt="Transfer Animation"
          style={{ width: "250px", height: "250px", marginBottom: "0px" }}
          initial={{ opacity: 0, y: -20 }}
          animate={imageControls}
        />
        <h2>Transfer Funds</h2>
        <div className="glass-container">
          <input
            className="glass-input"
            type="text"
            placeholder="Recipient Address"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
          />
          <input
            className="glass-input"
            type="number"
            placeholder="Amount in ETH"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
          />
          <button onClick={handleTransfer} disabled={isPending}>
            {isPending ? "Transferring…" : "Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Transfer;
