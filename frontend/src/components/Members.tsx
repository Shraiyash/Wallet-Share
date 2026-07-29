import { useEffect, useState } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useReadContract } from "wagmi";
import { walletContract } from "../config/contract";

function Members() {
  const [showAccessList, setShowAccessList] = useState(false);
  const imageControls = useAnimation();

  const { data: accessList = [] } = useReadContract({
    ...walletContract,
    functionName: "getAllowedUsers",
  });

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

  const handleToggleAccessList = () => setShowAccessList((prev) => !prev);

  const animationProps = {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
    transition: { delay: 0.2, duration: 1.0, ease: "easeInOut" as const },
  };

  return (
    <div className="members-container">
      <motion.img
        src="/members-transparent.png"
        alt="Members Animation"
        style={{ width: "250px", height: "250px", marginBottom: "0px" }}
        initial={{ opacity: 0, y: -20 }}
        animate={imageControls}
      />
      <h1>View Current Members of the Wallet</h1>
      <button className="access-btn" onClick={handleToggleAccessList}>
        {showAccessList ? "Hide Members List" : "Show Members List"}
      </button>
      <AnimatePresence>
        {showAccessList && (
          <motion.div key="access-list" {...animationProps} className="access-list">
            <h3>Members of Wallet:</h3>
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
  );
}

export default Members;
