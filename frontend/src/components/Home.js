import React, { useState, useEffect } from 'react';
import { Typewriter } from 'react-simple-typewriter';
import { motion } from 'framer-motion';
import './Home.css';

function Home({ walletAddress, contractBalance }) {
  const [showTypewriter, setShowTypewriter] = useState(false);

  useEffect(() => {
    const welcomeShown = localStorage.getItem('welcomeShown');
    if (!welcomeShown) {
      setShowTypewriter(true);
      // Once the animation completes (after a delay), mark it as shown.
      // We can either mark it immediately or after a timeout equal to the animation duration.
      localStorage.setItem('welcomeShown', 'true');
    }
  }, []);

  return (
    <div className="main-container home-container">
      <motion.img 
        src="/home-page-2.gif" 
        alt="Futuristic Animation"
        style={{ width: '250px', height: '250px', marginBottom: '20px' }}
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 1, ease: "easeInOut" }}
      />
      {/* {showTypewriter && (
        <h2 className="typewriter">
          <Typewriter
            words={[`Welcome ${walletAddress}`]}
            loop={1}
            cursor
            cursorStyle="|"
            typeSpeed={70}
            delaySpeed={900}
          />
        </h2>
      )} */}
      <motion.h3 
         className="contract-balance"
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 3.0, duration: 1, ease: "easeInOut" }}
      >
         Wallet Balance: {contractBalance} ETH
      </motion.h3>
    </div>
  );
}

export default Home;