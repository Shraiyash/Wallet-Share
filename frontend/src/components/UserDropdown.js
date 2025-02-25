import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function UserDropdown({ walletDisplayName, accountBalance, showDropdown, setShowDropdown }) {

  const display = walletDisplayName || "";

  return (
    <div className="user-dropdown">
    <motion.div 
      className="user-dropdown-motion"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: "easeInOut" }}
    >
      <button className="user-btn" onClick={() => setShowDropdown(!showDropdown)}>
        {display.slice(0, 6)}...{display.slice(-4)}
      </button>
      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            className="dropdown-content"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.0, duration: 0.3, ease: "easeInOut" }}
          >
            <p>Balance: {accountBalance} ETH</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </div>
  );
}

export default UserDropdown;