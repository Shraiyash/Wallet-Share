import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert from './CustomAlert.js'; 

function Admin({ contract }) {
  const [accessAddress, setAccessAddress] = useState("");
  const [accessAllowed, setAccessAllowed] = useState("");
  // Store the on-chain access list as an array
  const [accessList, setAccessList] = useState([]);
  const [showAccessList, setShowAccessList] = useState(false);

  const [alertData, setAlertData] = useState(null);

  // Fetch the allowed users from the contract when it becomes available
  useEffect(() => {
    async function fetchAllowedUsers() {
      if (contract) {
        try {
          const allowedUsersArray = await contract.getAllowedUsers();
          setAccessList(allowedUsersArray);
          console.error("allowed users:");
        } catch (err) {
          console.error("Error fetching allowed users:", err);
        }
      }
    }
    fetchAllowedUsers();
  }, [contract]);

  // Function to toggle the display of the access list
  const handleToggleAccessList = () => {
    setShowAccessList(prev => !prev);
  };

  // Function to set access on-chain and then update the list
  async function handleSetAccess() {
    try {
      const allowedBool = accessAllowed.toLowerCase() === "true";
      const tx = await contract.setAccess(accessAddress, allowedBool);
      await tx.wait();
      // Notify success (you could use a custom alert here as well)

      setAlertData({
        message: "Access set successfully!",
        type:"success"
      });
      // Re-fetch the allowed users list from the contract
      const allowedUsersArray = await contract.getAllowedUsers();
      setAccessList(allowedUsersArray);
    } catch (err) {
      console.error(err);
      setAlertData({
        message: "Setting access failed!",
        type:"failure"
      });
    }
  }

  return (
    <div className="admin-container">
      {alertData && (
          <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
       )}
      <div className="admin-left">
        <h1>Set Access Restrictions for each user</h1>
        <button className="access-btn" onClick={handleToggleAccessList}>
          {showAccessList ? "Hide Access List" : "Show Access List"}
        </button>
        <AnimatePresence>
          {showAccessList && (
            <motion.div 
              key="access-list"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ delay: 0.2, duration: 1.0, ease: "easeInOut" }}
              className="access-list"
            >
              <h3>Users with Access:</h3>
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
      <div className="admin-right">
        <motion.img 
          src="/admin.gif" 
          alt="Admin Animation" 
          style={{ width: "150px", height: "150px", marginBottom: "20px" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: "easeInOut" }}
        />
        <h2>Set Access Restrictions</h2>
        <div className="glass-container">
          <input 
            className="glass-input"
            type="text" 
            placeholder="Address" 
            value={accessAddress} 
            onChange={(e) => setAccessAddress(e.target.value)} 
          />
          <input 
            className="glass-input"
            type="text" 
            placeholder="Allowed? (true/false)" 
            value={accessAllowed} 
            onChange={(e) => setAccessAllowed(e.target.value)} 
          />
          <button onClick={handleSetAccess}>Set Access</button>
        </div>
      </div>
    </div>
  );
}

export default Admin;