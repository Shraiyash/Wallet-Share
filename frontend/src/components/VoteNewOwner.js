// src/components/VoteNewOwner.js
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CustomAlert from './CustomAlert.js'; 

function VoteNewOwner({ contract, ownerAddress }) {
  const [newOwnerAddress, setNewOwnerAddress] = useState("");

  const [alertData, setAlertData] = useState(null);

  async function handleVoteNewOwner() {
    try {
      const tx = await contract.voteForNewOwner(newOwnerAddress);
      await tx.wait();
      setAlertData({
        message: "Vote cast successfully!",
        type:"success"
      });
    } catch (err) {
      console.error(err);
      setAlertData({
        message: "Voting failed!",
        type:"failure"
      });
    }
  }

  const animationProps =
     {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 },
      transition: { delay: 0.2, duration: 1.0, ease: "easeInOut" }
      }

  return (
    <div className="vote-new-container">
      {alertData && (
          <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
       )}
      <div className="vote-new-left">
        <h1>Vote for a new owner of this Wallet</h1>
      
      <div class="curr-owner">
                      <motion.h3
                      key={ownerAddress}
                        {...animationProps}
                        className="curr-owner"
                      >
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
      <div className='glass-container'>
      <input className = "glass-input"
        type="text" 
        placeholder="New Owner Address" 
        value={newOwnerAddress} 
        onChange={(e) => setNewOwnerAddress(e.target.value)} 
      />
      <button onClick={handleVoteNewOwner}>Vote</button>
      </div>
      </div>
    </div>
  );
}

export default VoteNewOwner;