// src/components/AssignVoter.js
import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import CustomAlert from './CustomAlert.js'; 

function AssignVoter({ contract }) {
  const [voterAddress, setVoterAddress] = useState("");

  const [alertData, setAlertData] = useState(null);

  const imageControls = useAnimation();

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

  async function handleAssignVoter() {
    try {
      const tx = await contract.assignVoter(voterAddress);
      await tx.wait();
      setAlertData({
        message: "Voter assigned successfully!",
        type:"success"
      });
    } catch (err) {
      console.error(err);
      setAlertData({
        message: "Assigning voter failed!",
        type:"failure"
      });
    }
  }

  return (
    <div className="assign-voter-container">
      {alertData && (
          <CustomAlert alertData={alertData} onClose={() => setAlertData(null)} />
       )}
      <div className="assign-voter-left">
      <h1>Assign a voter to the election of a new owner</h1>
      </div>
      <div className="assign-voter-right">
       <motion.img 
          src="/voter.png" 
          alt="Transfer Animation" 
          style={{ width: "250px", height: "250px", marginBottom: "0px" }}
          initial={{ opacity: 0, y: -20 }}
          animate={imageControls}
          transition={{ delay: 0.2, duration: 1, ease: "easeInOut" }}
        />
      <h2>Assign Voter</h2>
      <div className='glass-container'>
      <input className='glass-input'
        type="text" 
        placeholder="Voter Address" 
        value={voterAddress} 
        onChange={(e) => setVoterAddress(e.target.value)} 
      />
      <button onClick={handleAssignVoter}>Assign Voter</button>
      </div>
      </div>
    </div>
  );
}

export default AssignVoter;