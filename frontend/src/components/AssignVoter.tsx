import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { isAddress, BaseError } from "viem";
import { useWriteContract, usePublicClient } from "wagmi";
import CustomAlert from "./CustomAlert";
import { walletContract } from "../config/contract";
import type { AlertData } from "../types";

function AssignVoter() {
  const [voterAddress, setVoterAddress] = useState("");
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

  async function handleAssignVoter() {
    if (!isAddress(voterAddress)) {
      setAlertData({ message: "Please enter a valid voter address.", type: "failure" });
      return;
    }
    try {
      const hash = await writeContractAsync({
        ...walletContract,
        functionName: "assignVoter",
        args: [voterAddress],
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      setAlertData({ message: "Voter assigned successfully!", type: "success" });
      setVoterAddress("");
    } catch (err) {
      const message = err instanceof BaseError ? err.shortMessage : "Assigning voter failed!";
      setAlertData({ message, type: "failure" });
    }
  }

  return (
    <div className="assign-voter-container">
      {alertData && (
        <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
      )}
      <div className="assign-voter-left">
        <h1>Assign a voter to the election of a new owner</h1>
      </div>
      <div className="assign-voter-right">
        <motion.img
          src="/voter.png"
          alt="Voter Animation"
          style={{ width: "250px", height: "250px", marginBottom: "0px" }}
          initial={{ opacity: 0, y: -20 }}
          animate={imageControls}
        />
        <h2>Assign Voter</h2>
        <div className="glass-container">
          <input
            className="glass-input"
            type="text"
            placeholder="Voter Address"
            value={voterAddress}
            onChange={(e) => setVoterAddress(e.target.value)}
          />
          <button onClick={handleAssignVoter} disabled={isPending}>
            {isPending ? "Assigning…" : "Assign Voter"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignVoter;
