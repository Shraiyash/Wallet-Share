import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";

import App from "./App";
import { wagmiConfig } from "./config/wagmi";

import "@rainbow-me/rainbowkit/styles.css";
import "./index.css";

// React Query powers all wagmi data fetching: request dedup, caching, and
// background refetching — replacing the old ad-hoc useEffect/useState fetches
// and the 2s balance polling loop.
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
