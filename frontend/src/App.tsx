import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import Home from "./components/Home";
import Deposit from "./components/Deposit";
import Transfer from "./components/Transfer";
import AssignVoter from "./components/AssignVoter";
import VoteNewOwner from "./components/VoteNewOwner";
import SetLimit from "./components/SetLimit";
import Admin from "./components/Admin";
import Members from "./components/Members";
import { useWalletState } from "./hooks/useWalletState";

import "./App.css";

function App() {
  const { isConnected, isAllowed, isOwner, address, ownerAddress, contractBalance } =
    useWalletState();

  return (
    <Router>
      <div className="app-wrapper">
        <AnimatePresence>
          {!isConnected ? (
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1.5, ease: "easeInOut" }}
              >
                <ConnectButton label="Connect Wallet" />
              </motion.div>
            </motion.div>
          ) : !isAllowed ? (
            <motion.div
              key="denied"
              className="login-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
            >
              <h1>Access Denied</h1>
              <p>Your account ({address}) is not authorized to access this wallet.</p>
              <div style={{ marginTop: 20 }}>
                <ConnectButton />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
            >
              <NavBar isOwner={isOwner} />
              <Routes>
                <Route
                  path="/"
                  element={
                    <Home walletAddress={address ?? ""} contractBalance={contractBalance} />
                  }
                />
                <Route path="/deposit" element={<Deposit />} />
                <Route path="/transfer" element={<Transfer contractBalance={contractBalance} />} />
                {isOwner && <Route path="/assign-voter" element={<AssignVoter />} />}
                <Route
                  path="/vote-new-owner"
                  element={<VoteNewOwner ownerAddress={ownerAddress ?? ""} />}
                />
                {isOwner && <Route path="/set-limit" element={<SetLimit />} />}
                {isOwner ? (
                  <Route path="/admin" element={<Admin />} />
                ) : (
                  <Route path="/members" element={<Members />} />
                )}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

type NavBarProps = {
  isOwner: boolean;
};

function NavBar({ isOwner }: NavBarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-item active" : "nav-item";

  return (
    <nav className="navbar">
      <div className="nav-left">
        <NavLink className="nav-logo-link" to="/">
          <img src="/new-logo.png" alt="My Logo" className="nav-logo-img" />
          <span className="nav-logo-text">Wallet Share</span>
        </NavLink>
      </div>
      <div className="nav-items">
        <NavLink to="/" className={linkClass}> Home</NavLink>
        <NavLink to="/deposit" className={linkClass}> Deposit</NavLink>
        <NavLink to="/transfer" className={linkClass}> Transfer</NavLink>
        {isOwner && (
          <NavLink to="/assign-voter" className={linkClass}> Assign Voter </NavLink>
        )}
        <NavLink to="/vote-new-owner" className={linkClass}> New Owner</NavLink>
        {isOwner && (
          <NavLink to="/set-limit" className={linkClass}> Set Limit </NavLink>
        )}
        {isOwner ? (
          <NavLink to="/admin" className={linkClass}> Admin</NavLink>
        ) : (
          <NavLink to="/members" className={linkClass}> Members</NavLink>
        )}
      </div>
      <div className="nav-right">
        {/* showBalance={false}: the chip shows your personal account balance,
            which is confusingly different from the contract's "Wallet Balance"
            on the dashboard. Hide it so the only ETH figure is the wallet's. */}
        <ConnectButton showBalance={false} accountStatus="avatar" chainStatus="icon" />
      </div>
    </nav>
  );
}

export default App;
