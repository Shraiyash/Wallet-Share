import { useState } from "react";
import { motion } from "framer-motion";
import { isAddress, BaseError } from "viem";
import CustomAlert from "./CustomAlert";
import { useWalletContract } from "../context/ActiveWallet";
import { useTxAction, txLabel } from "../hooks/useTxAction";
import type { AlertData } from "../types";

type Props = {
  ownerAddress: string;
};

function VoteNewOwner({ ownerAddress }: Props) {
  const walletContract = useWalletContract();
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [alertData, setAlertData] = useState<AlertData | null>(null);

  const { send, phase, isBusy } = useTxAction();

  async function handleVoteNewOwner() {
    if (!isAddress(newOwnerAddress)) {
      setAlertData({ message: "Please enter a valid address.", type: "failure" });
      return;
    }
    try {
      await send({
        ...walletContract,
        functionName: "voteForNewOwner",
        args: [newOwnerAddress],
      });
      setAlertData({ message: "Vote cast successfully!", type: "success" });
      setNewOwnerAddress("");
    } catch (err) {
      const message = err instanceof BaseError ? err.shortMessage : "Voting failed!";
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
    <div className="vote-new-container">
      {alertData && (
        <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
      )}
      <div className="vote-new-left">
        <h1>Vote for a new owner of this Wallet</h1>
        <div className="curr-owner">
          <motion.h3 key={ownerAddress} {...animationProps} className="curr-owner">
            Current Owner: {ownerAddress}
          </motion.h3>
        </div>
      </div>
      <div className="vote-new-right">
        <motion.img
          src="/new-owner.gif"
          alt="Vote Animation"
          style={{ width: "150px", height: "150px", marginBottom: "20px" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: "easeInOut" }}
        />
        <h2>Vote for New Owner</h2>
        <div className="glass-container">
          <input
            className="glass-input"
            type="text"
            placeholder="New Owner Address"
            value={newOwnerAddress}
            onChange={(e) => setNewOwnerAddress(e.target.value)}
          />
          <button onClick={handleVoteNewOwner} disabled={isBusy}>
            {txLabel(phase, "Vote", "Voting…")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoteNewOwner;
