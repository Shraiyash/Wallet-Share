import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import './App.css';

// Replace with your deployed contract address (from Truffle migration):
const contractAddress = "0x5041dc60397fe2c2bC8e8482AfA90277F30D2aBd";

const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "address", "name": "_voter", "type": "address"}],
    "name": "assignVoter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address payable", "name": "_to", "type": "address"},
      {"internalType": "uint256", "name": "amountToTransfer", "type": "uint256"}
    ],
    "name": "transferFunds",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address payable", "name": "_newOwner", "type": "address"}],
    "name": "voteForNewOwner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_whoCanSend", "type": "address"},
      {"internalType": "uint256", "name": "_restriction", "type": "uint256"}
    ],
    "name": "setLimit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address payable", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  },
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

function App() {
  const [provider, setProvider] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [contractOwner, setContractOwner] = useState("");
  const [contract, setContract] = useState(null);
  const [contractBalance, setContractBalance] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [voterAddress, setVoterAddress] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [setLimitAddress, setSetLimitAddress] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  async function connectWallet() {
    if (window.ethereum) {
      try {
        // Request account access via MetaMask
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(tempProvider);
        const signer = tempProvider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        // Instantiate the contract using the signer
        const tempContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(tempContract);

        // Fetch and set the contract owner address
        const ownerAddress = await tempContract.owner();
        setContractOwner(ownerAddress);

        // Fetch and set the contract balance ("shared money")
        fetchContractBalance(tempProvider, tempContract);

        // Log a sample BigNumber to verify ethers is working
        const sampleValue = ethers.BigNumber.from("1000");
        console.log("Sample BigNumber Value:", sampleValue.toString());
      } catch (err) {
        console.error("Error connecting wallet:", err);
      }
    } else {
      alert("Please install MetaMask!");
    }
  }

  async function fetchContractBalance(providerInstance, contractInstance) {
    if (providerInstance && contractInstance) {
      try {
        const bal = await providerInstance.getBalance(contractInstance.address);
        setContractBalance(ethers.utils.formatEther(bal));
      } catch (error) {
        console.error("Error fetching contract balance:", error);
      }
    }
  }

  async function depositFunds() {
    if (!contract) return;
    try {
      const tx = await contract.deposit({
        value: ethers.utils.parseEther(depositAmount)
      });
      await tx.wait();
      alert("Deposit successful!");
      // Refresh the contract balance
      fetchContractBalance(provider, contract);
    } catch (error) {
      console.error("Deposit error:", error);
      alert("Deposit failed!");
    }
  }

  async function transferFunds() {
    if (!contract) return;
    try {
      const tx = await contract.transferFunds(
        transferTo,
        ethers.utils.parseEther(transferAmount),
        { value: 0 }
      );
      await tx.wait();
      alert("Transfer successful!");
      // Refresh the contract balance after transfer
      fetchContractBalance(provider, contract);
    } catch (error) {
      console.error("Transfer error:", error);
      alert("Transfer failed!");
    }
  }

  async function assignVoterFunc() {
    if (!contract) return;
    try {
      const tx = await contract.assignVoter(voterAddress);
      await tx.wait();
      alert("Voter assigned successfully!");
    } catch (error) {
      console.error("Assign voter error:", error);
      alert("Assigning voter failed!");
    }
  }

  async function voteNewOwner() {
    if (!contract) return;
    try {
      const tx = await contract.voteForNewOwner(newOwnerAddress);
      await tx.wait();
      alert("Vote cast successfully!");
    } catch (error) {
      console.error("Vote error:", error);
      alert("Voting failed!");
    }
  }

  async function setLimitFunc() {
    if (!contract) return;
    try {
      const tx = await contract.setLimit(
        setLimitAddress,
        ethers.BigNumber.from(limitAmount)
      );
      await tx.wait();
      alert("Limit set successfully!");
    } catch (error) {
      console.error("Set limit error:", error);
      alert("Setting limit failed!");
    }
  }

  useEffect(() => {
    // Optionally refresh the contract balance periodically
    async function refreshContractBalance() {
      if (provider && contract) {
        const bal = await provider.getBalance(contract.address);
        setContractBalance(ethers.utils.formatEther(bal));
      }
    }
    refreshContractBalance();
  }, [provider, contract]);

  return (
    <div className="App">
      <motion.h1 initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        Smart Wallet
      </motion.h1>
      
      {walletAddress ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
          Connecte User: {walletAddress}
        </motion.p>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={connectWallet}
        >
          Connect Wallet
        </motion.button>
      )}

      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}>
        Wallet Balance: {contractBalance} ETH
      </motion.h2>

      {contractOwner && (
        <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.6 }}>
          Wallet Owner: {contractOwner}
        </motion.h3>
      )}

      <motion.div className="section" initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
        <h3>Deposit Funds</h3>
        <input
          type="text"
          placeholder="Amount in ETH"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
        />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={depositFunds}>
          Deposit
        </motion.button>
      </motion.div>

      <motion.div className="section" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
        <h3>Transfer Funds</h3>
        <input
          type="text"
          placeholder="Recipient Address"
          value={transferTo}
          onChange={(e) => setTransferTo(e.target.value)}
        />
        <input
          type="text"
          placeholder="Amount in ETH"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
        />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={transferFunds}>
          Transfer
        </motion.button>
      </motion.div>

      <motion.div className="section" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
        <h3>Assign Voter (Owner Only)</h3>
        <input
          type="text"
          placeholder="Voter Address"
          value={voterAddress}
          onChange={(e) => setVoterAddress(e.target.value)}
        />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={assignVoterFunc}>
          Assign Voter
        </motion.button>
      </motion.div>

      <motion.div className="section" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
        <h3>Vote for New Owner</h3>
        <input
          type="text"
          placeholder="New Owner Address"
          value={newOwnerAddress}
          onChange={(e) => setNewOwnerAddress(e.target.value)}
        />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={voteNewOwner}>
          Vote
        </motion.button>
      </motion.div>

      <motion.div className="section" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
        <h3>Set Transfer Limit (Owner Only)</h3>
        <input
          type="text"
          placeholder="Address"
          value={setLimitAddress}
          onChange={(e) => setSetLimitAddress(e.target.value)}
        />
        <input
          type="number"
          placeholder="Limit Amount"
          value={limitAmount}
          onChange={(e) => setLimitAmount(e.target.value)}
        />
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={setLimitFunc}>
          Set Limit
        </motion.button>
      </motion.div>
    </div>
  );
}

export default App;