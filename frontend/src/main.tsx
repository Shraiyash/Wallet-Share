import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";

import App from "./App";
import {
  appKitNetworks,
  wagmiAdapter,
  wagmiConfig,
  walletConnectProjectId,
} from "./config/wagmi";

import "./index.css";

// React Query powers all wagmi data fetching: request dedup, caching, and
// background refetching — replacing the old ad-hoc useEffect/useState fetches
// and the 2s balance polling loop.
const queryClient = new QueryClient();

// AppKit replaces RainbowKit's modal. The reason is the sign-in options: it
// hosts Google/Apple/email logins that mint a wallet for people who don't have
// one, which is what makes the landing page usable by a non-crypto visitor.
createAppKit({
  adapters: [wagmiAdapter],
  networks: appKitNetworks,
  projectId: walletConnectProjectId || "PLACEHOLDER",
  metadata: {
    name: "Wallet Share",
    description: "A shared crypto wallet for people you trust.",
    url: window.location.origin,
    icons: [`${window.location.origin}/new-logo.png`],
  },
  features: {
    email: true,
    socials: ["google", "apple", "x", "github", "discord"],
    // Keep the wallet list available so existing crypto users aren't forced
    // through a social login they don't want.
    emailShowWallets: true,
    analytics: true,
  },
  // Match the existing dark, blue-accented look of the app.
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#0070f3",
    "--w3m-font-family": "'Montserrat', 'Segoe UI', sans-serif",
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
