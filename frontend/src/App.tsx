import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppKitButton, useAppKit } from "@reown/appkit/react";
import { useAppKitWallet } from "@reown/appkit-wallet-button/react";
import { FcGoogle } from "react-icons/fc";
import { FaApple, FaWallet } from "react-icons/fa";
import { MdMailOutline } from "react-icons/md";

import Home from "./components/Home";
import Deposit from "./components/Deposit";
import Transfer from "./components/Transfer";
import AssignVoter from "./components/AssignVoter";
import VoteNewOwner from "./components/VoteNewOwner";
import SetLimit from "./components/SetLimit";
import Admin from "./components/Admin";
import Members from "./components/Members";
import WalletPicker from "./components/WalletPicker";
import JoinInvite from "./components/JoinInvite";
import { useWalletState } from "./hooks/useWalletState";
import { ActiveWalletProvider, useActiveWallet } from "./context/ActiveWallet";

import "./App.css";

function App() {
  return (
    <Router>
      <ActiveWalletProvider>
        <Shell />
      </ActiveWalletProvider>
    </Router>
  );
}

function Shell() {
  const {
    isConnected,
    accessStatus,
    refetchAccess,
    isOwner,
    address,
    ownerAddress,
    contractBalance,
  } = useWalletState();
  const { activeWallet, setActiveWallet } = useActiveWallet();
  const location = useLocation();
  const navigate = useNavigate();

  // An invite link has to work before sign-in and before a wallet is picked,
  // so it is checked ahead of everything else.
  if (location.pathname === "/join") {
    return (
      <div className="app-wrapper">
        <JoinInvite onDone={() => navigate("/")} />
      </div>
    );
  }

  return (
    <>
      <div className="app-wrapper">
        <AnimatePresence>
          {!isConnected ? (
            <Landing key="login" />
          ) : !activeWallet ? (
            <WalletPicker key="picker" />
          ) : accessStatus === "loading" ? (
            <motion.div
              key="checking"
              className="login-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
            >
              <h1>Checking access…</h1>
            </motion.div>
          ) : accessStatus === "error" ? (
            <motion.div
              key="access-error"
              className="login-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
            >
              <h1>Couldn't verify access</h1>
              <p className="hero-sub">
                We couldn't reach the network to check this account. This is a
                connection problem, not a permissions one.
              </p>
              <div className="signin-panel">
                <button
                  className="signin-btn signin-btn--primary"
                  onClick={() => refetchAccess()}
                >
                  Try again
                </button>
              </div>
            </motion.div>
          ) : accessStatus === "denied" ? (
            <RequestAccess
              key="denied"
              address={address}
              onRecheck={() => refetchAccess()}
              onBack={() => setActiveWallet(null)}
            />
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
            >
              <NavBar isOwner={isOwner} onSwitchWallet={() => setActiveWallet(null)} />
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
    </>
  );
}

/**
 * Landing page for someone who may never have used a crypto wallet.
 *
 * The social buttons are real one-click logins, not shortcuts into a wallet
 * picker: AppKit mints an embedded wallet behind the Google/Apple/email
 * account, so a visitor with no wallet and no seed phrase can still get in.
 * Existing crypto users get the full wallet list via the secondary link.
 */
function Landing() {
  const { open } = useAppKit();
  const { connect, isPending } = useAppKitWallet();

  return (
    <motion.div
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
        style={{ width: "180px", height: "180px", margin: "12px 0" }}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
      />

      <motion.div
        className="signin-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 1.2, ease: "easeInOut" }}
      >
        <button
          className="signin-btn signin-btn--google"
          onClick={() => connect("google")}
          disabled={isPending}
        >
          <FcGoogle className="signin-icon" aria-hidden="true" />
          Continue with Google
        </button>

        <button
          className="signin-btn signin-btn--apple"
          onClick={() => connect("apple")}
          disabled={isPending}
        >
          <FaApple className="signin-icon" aria-hidden="true" />
          Continue with Apple
        </button>

        <button
          className="signin-btn signin-btn--primary"
          onClick={() => connect("email")}
          disabled={isPending}
        >
          <MdMailOutline className="signin-icon" aria-hidden="true" />
          Continue with email
        </button>

        <div className="signin-divider">
          <span>or</span>
        </div>

        <button
          className="signin-secondary"
          onClick={() => open({ view: "Connect" })}
          disabled={isPending}
        >
          <FaWallet className="signin-icon" aria-hidden="true" />
          Connect an existing wallet
        </button>
      </motion.div>
    </motion.div>
  );
}

type RequestAccessProps = {
  address?: `0x${string}`;
  onRecheck: () => void;
  onBack: () => void;
};

/**
 * Shown once someone is signed in but not on the contract's allow list.
 *
 * Signing in is easy now, so this is where most new visitors will land. It has
 * to explain the situation and hand them their address to share, rather than
 * reading as a flat rejection with nothing to do next.
 */
function RequestAccess({ address, onRecheck, onBack }: RequestAccessProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div
      className="login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
    >
      <h1>You're in — almost</h1>
      <p className="hero-sub">
        Wallet Share is invite-only. Send the address below to whoever owns the
        wallet and ask them to add you as a member.
      </p>

      <div className="address-card">
        <code className="address-code">{address}</code>
        <button className="signin-secondary" onClick={handleCopy}>
          {copied ? "Copied" : "Copy address"}
        </button>
      </div>

      <div className="signin-panel">
        <button className="signin-btn signin-btn--primary" onClick={onRecheck}>
          I've been added — check again
        </button>
        <div className="signin-divider">
          <span>or</span>
        </div>
        <button className="signin-secondary" onClick={onBack}>
          Back to my wallets
        </button>
      </div>
    </motion.div>
  );
}

type NavBarProps = {
  isOwner: boolean;
  onSwitchWallet: () => void;
};

function NavBar({ isOwner, onSwitchWallet }: NavBarProps) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-item active" : "nav-item";

  // Remembered across sessions so a preference sticks; "classic" restores the
  // original hand-tuned bar exactly, since the refined rules are pure overrides.
  const [navTheme, setNavTheme] = useState<"refined" | "classic">(() => {
    const stored = localStorage.getItem("walletshare.navTheme");
    return stored === "classic" ? "classic" : "refined";
  });

  const [hovered, setHovered] = useState<string | null>(null);

  const toggleTheme = () => {
    const next = navTheme === "refined" ? "classic" : "refined";
    setNavTheme(next);
    localStorage.setItem("walletshare.navTheme", next);
  };

  const refined = navTheme === "refined";

  const links = [
    { to: "/", label: "Home" },
    { to: "/deposit", label: "Deposit" },
    { to: "/transfer", label: "Transfer" },
    ...(isOwner ? [{ to: "/assign-voter", label: "Assign Voter" }] : []),
    { to: "/vote-new-owner", label: "New Owner" },
    ...(isOwner ? [{ to: "/set-limit", label: "Set Limit" }] : []),
    isOwner ? { to: "/admin", label: "Admin" } : { to: "/members", label: "Members" },
  ];

  // Snappy but settled — an Apple control arrives quickly and doesn't wobble.
  const slide = { type: "spring", stiffness: 420, damping: 34, mass: 0.7 } as const;

  return (
    <nav className={refined ? "navbar navbar--refined" : "navbar"}>
      <div className="nav-left">
        <NavLink className="nav-logo-link" to="/">
          <img src="/new-logo.png" alt="My Logo" className="nav-logo-img" />
          <span className="nav-logo-text">Wallet Share</span>
        </NavLink>
      </div>
      <div className="nav-items" onMouseLeave={() => setHovered(null)}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={linkClass}
            onMouseEnter={() => setHovered(link.to)}
          >
            {({ isActive }) => (
              <>
                {/* Two shared layoutIds, so the highlights physically travel
                    between items instead of fading out and in. The selected
                    pill and the hover pill move independently — hovering
                    elsewhere never makes you lose sight of where you are. */}
                {refined && isActive && (
                  <motion.span
                    layoutId="nav-selected"
                    className="nav-pill nav-pill--selected"
                    transition={slide}
                  />
                )}
                {refined && hovered === link.to && !isActive && (
                  <motion.span
                    layoutId="nav-hovered"
                    className="nav-pill nav-pill--hovered"
                    transition={slide}
                  />
                )}
                <span className="nav-label">{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="nav-right">
        <button
          className="nav-theme-toggle"
          onClick={toggleTheme}
          title="Switch between the original nav bar and the refined one"
        >
          {refined ? "Classic look" : "Refined look"}
        </button>
        <button className="nav-switch" onClick={onSwitchWallet}>
          Switch wallet
        </button>
        {/* balance="hide": the chip shows your personal account balance, which
            is confusingly different from the contract's "Wallet Balance" on the
            dashboard. Hide it so the only ETH figure is the wallet's. */}
        <AppKitButton balance="hide" />
      </div>
    </nav>
  );
}

export default App;
