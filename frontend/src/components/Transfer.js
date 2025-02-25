// src/components/Transfer.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion, useAnimation } from 'framer-motion';
import CustomAlert from './CustomAlert.js'; 

function Transfer({ contract, contractBalance }) {
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [alertData, setAlertData] = useState(null);

  const imageControls = useAnimation();

  // Run initial animation and then start the infinite up-and-down motion.
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

  async function handleTransfer() {
    try {
      const tx = await contract.transferFunds(
        transferTo,
        ethers.utils.parseEther(transferAmount),
        { value: 0 }
      );
      await tx.wait();
      setAlertData({
        message: "Transfer Successful!",
        type:"success"
      });
    } catch (err) {
      console.error(err);
      setAlertData({
        message: "Transfer failed!",
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
    <div className="transfer-container">
      {alertData && (
          <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
       )}
      <div className="transfer-left">
      <h1>Transfer money across the world</h1>
                <div class="transfer-curr-bal">
                <motion.h3
                key={contractBalance}
                  {...animationProps}
                  className="transfer-curr-bal"
                >
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
          transition={{ delay: 0.2, duration: 1, ease: "easeInOut" }}
        />
        <h2>Transfer Funds</h2>
        <div className='glass-container'>
        <input class = "glass-input"
          type="text" 
          placeholder="Recipient Address" 
          value={transferTo} 
          onChange={(e) => setTransferTo(e.target.value)} 
        />
        <input class = "glass-input"
          type="number" 
          placeholder="Amount in ETH" 
          value={transferAmount} 
          onChange={(e) => setTransferAmount(e.target.value)} 
        />
        <button onClick={handleTransfer}>Transfer</button>
        </div>
      </div>
    </div>
  );
}

export default Transfer;