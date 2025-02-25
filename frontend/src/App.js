import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Import your feature components
import Home from './components/Home';
import Deposit from './components/Deposit';
import Transfer from './components/Transfer';
import AssignVoter from './components/AssignVoter';
import VoteNewOwner from './components/VoteNewOwner';
import SetLimit from './components/SetLimit';
import Admin from './components/Admin';
import Members from './components/Members';
import UserDropdown from './components/UserDropdown';
import CustomAlert from './components/CustomAlert';

const contractAddress = "0x85d17a400bEF4A86eab9A35baa8a814727EDb164";

const contractABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [{"internalType": "address", "name": "_voter", "type": "address"}], "name": "assignVoter", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"internalType": "address payable", "name": "_to", "type": "address"}, {"internalType": "uint256", "name": "amountToTransfer", "type": "uint256"}], "name": "transferFunds", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{"internalType": "address payable", "name": "_newOwner", "type": "address"}], "name": "voteForNewOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{"internalType": "address", "name": "_whoCanSend", "type": "address"}, {"internalType": "uint256", "name": "_restriction", "type": "uint256"}], "name": "setLimit", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "owner", "outputs": [{"internalType": "address payable", "name": "", "type": "address"}], "stateMutability": "view", "type": "function" },
  { "stateMutability": "payable", "type": "receive" },
  { "inputs": [], "name": "deposit", "outputs": [], "stateMutability": "payable", "type": "function" },
  {
    "inputs": [],
    "name": "getAllowedUsers",
    "outputs": [
      { "internalType": "address[]", "name": "", "type": "address[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "allowedUsers",
    "outputs": [
      { "internalType": "address[]", "name": "", "type": "address[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userDeposits",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Access control functions:
  { "inputs": [], "name": "isAllowed", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"internalType": "address", "name": "_addr", "type": "address"}], "name": "isOwner", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function" },
  { "inputs": [{"internalType": "address", "name": "user", "type": "address"}, {"internalType": "bool", "name": "allowed", "type": "bool"}], "name": "setAccess", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

function App() {
  const [provider, setProvider] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [contract, setContract] = useState(null);
  const [accessAllowed, setAccessAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [accountBalance, setAccountBalance] = useState("");
  const [contractBalance, setContractBalance] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [alertData, setAlertData] = useState(null);

  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [loading]);

  const handleLogout = () => {
    // Set the alertData to trigger a confirm modal.
    setAlertData({
      message: "Are you sure you want to log out?",
      confirm: true,
      onConfirm: () => {
        localStorage.removeItem('welcomeShown');
        localStorage.removeItem('userDepositTotal');
        window.location.reload();
      }
    });
  };

  async function connectWallet() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(tempProvider);
        const signer = tempProvider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        let ensName = "";
        try {
          ensName = await tempProvider.lookupAddress(address);
        } catch (lookupError) {
          console.warn("ENS lookup failed:", lookupError);
        }
        setDisplayName(ensName && ensName.length > 0 ? ensName : address);

        const tempContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(tempContract);

        // Get the contract's owner and check if current wallet is owner
        const owner = await tempContract.owner();
        setOwnerAddress(owner);
        const ownerCheck = await tempContract.isOwner(address);
        setIsOwner(ownerCheck);

        const allowed = await tempContract.isAllowed();
        setAccessAllowed(allowed);

        const accBal = await tempProvider.getBalance(address);
        setAccountBalance(ethers.utils.formatEther(accBal));

        const contBal = await tempProvider.getBalance(tempContract.address);
        setContractBalance(ethers.utils.formatEther(contBal));

        setLoading(false);
      } catch (err) {
        console.error("Error connecting wallet:", err);
      }
    } else {
      alert("Please install MetaMask!");
    }
  }

  // Remove automatic wallet connection so that the login page remains until user clicks the connect button.
  // useEffect(() => { connectWallet(); }, []); // Commented out

  // Refresh contract balance every 8 seconds
  useEffect(() => {
    async function fetchContractBalance() {
      if (provider && contract) {
        try {
          const bal = await provider.getBalance(contract.address);
          setContractBalance(ethers.utils.formatEther(bal));
        } catch (err) {
          console.error("Error fetching contract balance:", err);
        }
      }
    }
    if (!loading) {
      fetchContractBalance();
      const interval = setInterval(fetchContractBalance, 2000);
      return () => clearInterval(interval);
    }
  }, [provider, contract, loading]);

  return (
    <Router>
      <div className="app-wrapper">
        <AnimatePresence>
          {loading ? (
            <motion.div
              key="login"
              className="login-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
            >
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                Welcome to Wallet Share
              </motion.h1>
              <motion.img 
                src="/login-page-new.gif" 
                alt="Wallet Animation" 
                style={{ width: "200px", height: "200px", margin: "20px 0" }}
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 1, ease: "easeInOut" }}
              />
              <motion.button
                className="connect-btn"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectWallet}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
              >
                Connect Wallet
              </motion.button>
            </motion.div>
          ) : !accessAllowed ? (
            <motion.div
              key="denied"
              className="login-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
            >
              <h1>Access Denied</h1>
              <p>Your account ({walletAddress}) is not authorized to access this wallet.</p>
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
            >
              <NavBar 
                onLogout={handleLogout}
                walletDisplayName={displayName || walletAddress}
                accountBalance={accountBalance}
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
                walletAddress={walletAddress}
                ownerAddress={ownerAddress}
                isOwner={isOwner}
              />
              <Routes>
                <Route path="/" element={<Home walletAddress={displayName || walletAddress} contractBalance={contractBalance} />} />
                <Route path="/deposit" element={<Deposit contract={contract} walletAddress={walletAddress} />} />
                <Route path="/transfer" element={<Transfer contract={contract} contractBalance={contractBalance} />} />
                {isOwner ? (
                  <Route path="/assign-voter" element={<AssignVoter contract={contract} />} />
                ) : null}
                <Route path="/vote-new-owner" element={<VoteNewOwner contract={contract} ownerAddress={ownerAddress} />} />
                {isOwner ? (
                  <Route path="/set-limit" element={<SetLimit contract={contract} />} />
                ) : null}
                { isOwner ? (
                  <Route path="/admin" element={<Admin contract={contract} />} />
                ) : (
                  <Route path="/members" element={<Members contract={contract} />} />
                )}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </motion.div>
          )}
        </AnimatePresence>
        {alertData && (
          <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
        )}
      </div>
    </Router>
  );
}

function NavBar({ isOwner, onLogout, walletDisplayName, accountBalance, showDropdown, setShowDropdown, walletAddress, ownerAddress }) {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <NavLink className="nav-logo-link" to="/">
          <img src="/new-logo.png" alt="My Logo" className="nav-logo-img" />
          <span className="nav-logo-text">Wallet Share</span>
        </NavLink>
      </div>
      <div className="nav-items">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}> Home</NavLink>
        <NavLink to="/deposit" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}> Deposit</NavLink>
        <NavLink to="/transfer" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}> Transfer</NavLink>
        {isOwner && (
          <NavLink to="/assign-voter" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}> Assign Voter </NavLink>
        )}
        <NavLink to="/vote-new-owner" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}> New Owner</NavLink>
        {isOwner && (
          <NavLink to="/set-limit" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}> Set Limit </NavLink>
        )}
        { isOwner ? (
          <NavLink to="/admin" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}> Admin</NavLink>
        ) : (
          <NavLink to="/members" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}> Members</NavLink>
        )}
      </div>
      <div className="nav-right">
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default App;