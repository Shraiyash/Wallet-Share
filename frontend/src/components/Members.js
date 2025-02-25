import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

function Members({contract}) {
  const [accessList, setAccessList] = useState([]);
  const [showAccessList, setShowAccessList] = useState(false);

  const imageControls = useAnimation();

  useEffect(() => {
      async function sequence() {
        // Initial fade in & slide to natural position.
        await imageControls.start({
          opacity: 1,
          y: 0,
          transition: { delay: 0.3, duration: 1, ease: "easeInOut" }
        });
        // After the initial animation completes, start an infinite oscillation.
        imageControls.start({
          y: [0, -2, -4, -5, -4, -2, 0, 2, 4, 5, 4, 2, 0],
          transition: {
            duration: 5, // Adjust duration as needed
            repeat: Infinity,
            ease: "linear"
          }
        });
      }
      sequence();
    }, [imageControls]);

  // Fetch the allowed users from the contract when it becomes available.
  useEffect(() => {
    async function fetchAllowedUsers() {
      if (contract) {
        try {
          const allowedUsers = await contract.getAllowedUsers();
          setAccessList(allowedUsers);
        } catch (err) {
          console.error("Error fetching allowed users:", err);
        }
      }
    }
    fetchAllowedUsers();
  }, [contract]);

  const handleToggleAccessList = () => {
    setShowAccessList(prev => !prev);
  };

  // Animation for reveal from the top
  const animationProps =
     {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 },
      transition: { delay: 0.2, duration: 1.0, ease: "easeInOut" }
      }

  return (
    <div className="members-container">
      <motion.img 
                src="/members-transparent.png" 
                alt="Transfer Animation" 
                style={{ width: "250px", height: "250px", marginBottom: "0px" }}
                initial={{ opacity: 0, y: -20 }}
                animate={imageControls}
                transition={{ delay: 0.2, duration: 1, ease: "easeInOut" }}
              />
      <h1>View Current Members of the Wallet</h1>
      <button className="access-btn" onClick={handleToggleAccessList}>
        {showAccessList ? "Hide Members List" : "Show Members List"}
      </button>
      <AnimatePresence>
        {showAccessList && (
          <motion.div key="{accessList}" {...animationProps} className="access-list">
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