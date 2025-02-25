// src/components/SetLimit.js
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import CustomAlert from './CustomAlert.js'; 

function SetLimit({ contract }) {
  const [limitAddress, setLimitAddress] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  const [alertData, setAlertData] = useState(null);

  async function handleSetLimit() {
    try {
      const tx = await contract.setLimit(limitAddress, ethers.BigNumber.from(limitAmount));
      await tx.wait();
      setAlertData({
        message: "Limit set successfully!",
        type:"success"
      });
    } catch (err) {
      console.error(err);
      setAlertData({
        message: "Setting limit failed!",
        type:"failure"
      });
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
      <div className='glass-container'>
      <input className='glass-input'
        type="text" 
        placeholder="Address" 
        value={limitAddress} 
        onChange={(e) => setLimitAddress(e.target.value)} 
      />
      <input className='glass-input'
        type="number" 
        placeholder="Limit Amount" 
        value={limitAmount} 
        onChange={(e) => setLimitAmount(e.target.value)} 
      />
      <button onClick={handleSetLimit}>Set Limit</button>
      </div>
      </div>
    </div>
  );
}

export default SetLimit;