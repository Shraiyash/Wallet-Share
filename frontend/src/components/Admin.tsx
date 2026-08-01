import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isAddress, BaseError } from "viem";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import CustomAlert from "./CustomAlert";
import { useWalletContract } from "../context/ActiveWallet";
import InviteLink from "./InviteLink";
import type { AlertData } from "../types";

function Admin() {
  const walletContract = useWalletContract();
  const [accessAddress, setAccessAddress] = useState("");
  const [accessAllowed, setAccessAllowed] = useState(true);
  const [showAccessList, setShowAccessList] = useState(false);
  const [alertData, setAlertData] = useState<AlertData | null>(null);

  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: accessList = [], refetch } = useReadContract({
    ...walletContract,
    functionName: "getAllowedUsers",
  });

  const handleToggleAccessList = () => setShowAccessList((prev) => !prev);

  async function handleSetAccess() {
    if (!isAddress(accessAddress)) {
      setAlertData({ message: "Please enter a valid address.", type: "failure" });
      return;
    }
    try {
      const hash = await writeContractAsync({
        ...walletContract,
        functionName: "setAccess",
        args: [accessAddress, accessAllowed],
      });
      await publicClient?.waitForTransactionReceipt({ hash });
      setAlertData({ message: "Access set successfully!", type: "success" });
      setAccessAddress("");
      refetch();
    } catch (err) {
      const message = err instanceof BaseError ? err.shortMessage : "Setting access failed!";
      setAlertData({ message, type: "failure" });
    }
  }

  return (
    <div className="admin-container">
      <InviteLink />
      {alertData && (
        <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
      )}
      <div className="admin-left">
        <h1>Set Access Restrictions for each user</h1>
        <button className="access-btn" onClick={handleToggleAccessList}>
          {showAccessList ? "Hide Access List" : "Show Access List"}
        </button>
        <AnimatePresence>
          {showAccessList && (
            <motion.div
              key="access-list"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ delay: 0.2, duration: 1.0, ease: "easeInOut" }}
              className="access-list"
            >
              <h3>Users with Access:</h3>
              {accessList.length === 0 ? (
                <p>No users have been granted access yet.</p>
              ) : (
                <ul>
                  {accessList.map((address, index) => (
                    <li key={index}>{address}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="admin-right">
        <motion.img
          src="/admin.gif"
          alt="Admin Animation"
          style={{ width: "150px", height: "150px", marginBottom: "20px" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: "easeInOut" }}
        />
        <h2>Set Access Restrictions</h2>
        <div className="glass-container">
          <input
            className="glass-input"
            type="text"
            placeholder="Address"
            value={accessAddress}
            onChange={(e) => setAccessAddress(e.target.value)}
          />
          <select
            className="glass-input"
            value={accessAllowed ? "true" : "false"}
            onChange={(e) => setAccessAllowed(e.target.value === "true")}
          >
            <option value="true">Grant access</option>
            <option value="false">Revoke access</option>
          </select>
          <button onClick={handleSetAccess} disabled={isPending}>
            {isPending ? "Saving…" : "Set Access"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Admin;
