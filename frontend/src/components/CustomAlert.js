import React from 'react';
import { motion } from 'framer-motion';

const CustomAlert = ({ alertData, onClose }) => {
  const { message, confirm, onConfirm } = alertData;

  return (
    <div className="alert-backdrop" onClick={onClose}>
      <motion.div
        className="alert-modal"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        <p>{message}</p>
        {confirm ? (
          <div className="button-group">
            <button onClick={() => { onConfirm(); onClose(); }}>Yes</button>
            <button onClick={onClose}>No</button>
          </div>
        ) : (
          <button onClick={onClose}>OK</button>
        )}
      </motion.div>
    </div>
  );
};

export default CustomAlert;