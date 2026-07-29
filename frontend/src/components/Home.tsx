import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./Home.css";

type Props = {
  walletAddress: string;
  contractBalance: string;
};

function Home({ contractBalance }: Props) {
  const [, setShowTypewriter] = useState(false);

  useEffect(() => {
    const welcomeShown = localStorage.getItem("welcomeShown");
    if (!welcomeShown) {
      setShowTypewriter(true);
      localStorage.setItem("welcomeShown", "true");
    }
  }, []);

  return (
    <div className="main-container home-container">
      <motion.img
        src="/home-page-2.gif"
        alt="Futuristic Animation"
        style={{ width: "250px", height: "250px", marginBottom: "20px" }}
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 1, ease: "easeInOut" }}
      />
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
