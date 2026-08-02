import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isAddress, BaseError } from "viem";
import { useReadContract } from "wagmi";
import CustomAlert from "./CustomAlert";
import { useWalletContract } from "../context/ActiveWallet";
import { useTxAction, txLabel } from "../hooks/useTxAction";
import InviteLink from "./InviteLink";
import type { AlertData } from "../types";

function Admin() {
  const walletContract = useWalletContract();
  const [accessAddress, setAccessAddress] = useState("");
  const [accessAllowed, setAccessAllowed] = useState(true);
  const [showAccessList, setShowAccessList] = useState(false);
  const [alertData, setAlertData] = useState<AlertData | null>(null);

  const { send, phase, isBusy } = useTxAction();

  const { data: accessList = [] } = useReadContract({
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
      await send({
        ...walletContract,
        functionName: "setAccess",
        args: [accessAddress, accessAllowed],
      });
      setAlertData({ message: "Access set successfully!", type: "success" });
      setAccessAddress("");
    } catch (err) {
      const message = err instanceof BaseError ? err.shortMessage : "Setting access failed!";
      setAlertData({ message, type: "failure" });
    }
  }

  return (
    <div className="admin-container">
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
        {/* Inviting someone and granting them access are the same job seen from
            two ends, so the invite panel belongs in this column with the access
            list rather than floating as a third column of its own. */}
        <InviteLink />
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
          <button onClick={handleSetAccess} disabled={isBusy}>
            {txLabel(phase, "Set Access", "Saving…")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Admin;
