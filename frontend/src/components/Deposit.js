// src/components/Deposit.js
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import CustomAlert from './CustomAlert.js'; 

function Deposit({ contract, walletAddress }) {
  const [depositAmount, setDepositAmount] = useState("");
  const [userDepositTotal, setUserDepositTotal] = useState("0.0");

  const [alertData, setAlertData] = useState(null);

  // Load saved deposit total from localStorage when the component mounts
  const [hasDeposited, setHasDeposited] = useState(false);

  async function fetchUserDepositTotal() {
    if (contract && walletAddress) {
      try {
        const total = await contract.userDeposits(walletAddress);
        // Format the total from wei to ETH
        setUserDepositTotal(ethers.utils.formatEther(total));
      } catch (err) {
        console.error("Error fetching user's deposit total:", err);
      }
    }
  }

  // Load saved deposit total from localStorage when the component mounts
  useEffect(() => {
    fetchUserDepositTotal();
  }, [contract, walletAddress]);

  // const Input = ({placeholder, name, type, value, handleChange}) => ( 
  //   <input 
  //     placeholder ={palceholder}
  //     type={type}
  //     step="0.0001
  //     value={value}
  //     onChange={(e) => handleChange(e, name)}
  //     className="my-2 w-full rounded-sm p-2 outline-none bg-transparent text-white border-none text-small white-glassmorphism"
  //   />
  // );

  async function handleDeposit() {
    try {
      const tx = await contract.deposit({
        value: ethers.utils.parseEther(depositAmount)
      });
      await tx.wait();
      setAlertData({
        message: "Deposit successful!",
        type:"success"
      });
      if (!hasDeposited) setHasDeposited(true);


      // Clear the input field
      setDepositAmount("");

      fetchUserDepositTotal();
      
    } catch (err) {
      console.error(err);
      setAlertData({
        message: "Deposit failed!",
        type:"failure"
      });
    }
  }

  const animationProps = hasDeposited
    ? {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 },
      transition: { delay: 0.2, duration: 1.0, ease: "easeInOut" }
      }
    : {
        initial: { x: -100, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 100, opacity: 0 },
        transition: { delay: 0.2, duration: 0.5, ease: "easeInOut" }
      };

  return (
    <div className="deposit-page-container">
      {alertData && (
          <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
       )}
      <div className="deposit-left">
        <h1>Deposit money into the Wallet</h1>
        <div class="total-deposit">
          <motion.div
            key={userDepositTotal}  // Changing key triggers re-mount & animation
            {...animationProps}
            className="total-deposit"
          >
            <h3>Total Money Deposited: {userDepositTotal}</h3>
            </motion.div>
          </div>
      </div>
      <div className="deposit-right">
      <motion.img 
        src="/deposit-new.gif" 
        alt="Deposit Animation" 
        style={{ width: "250px", height: "250px", marginBottom: "20px" }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1, ease: "easeInOut" }}
      />
      <h2>Deposit Funds</h2>
      <div class="glass-container">
      <input class = "glass-input"
        type="number" 
        placeholder="Amount in ETH" 
        value={depositAmount} 
        onChange={(e) => setDepositAmount(e.target.value)} 
      />
        
      <button onClick={handleDeposit}>Deposit</button>
      </div>
      </div>
    </div>
  );
}

export default Deposit;