import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useWriteContract, type Config } from "wagmi";
import type { WriteContractVariables } from "@wagmi/core/query";
import type { Abi, ContractFunctionArgs, ContractFunctionName } from "viem";

/**
 * Where a write currently is:
 *   signing    — waiting for the user to approve in their wallet
 *   confirming — submitted, waiting for the block that includes it
 */
export type TxPhase = "idle" | "signing" | "confirming";

/**
 * viem polls for the receipt at the client's `pollingInterval`, which defaults
 * to 4s. On a 12s-block chain that meant up to a third of the wait was us not
 * having asked yet — the transaction was mined and the UI simply hadn't
 * noticed. This only runs while a write is in flight, so the extra requests
 * are a handful per transaction, not a standing cost.
 */
export const RECEIPT_POLL_MS = 400;

/**
 * One place for "send a transaction and make the rest of the app catch up".
 *
 * Every screen used to write this by hand and each got a bit of it wrong: the
 * receipt was polled at the sluggish default, `isPending` only covered the
 * signing step so the button looked idle while the chain was still working,
 * and only the screen you were on refetched — the nav balance waited on an
 * event poller, so the number you had just changed stayed stale.
 */
export function useTxAction() {
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<TxPhase>("idle");

  // The generics mirror wagmi's own `writeContractAsync` rather than going
  // through `Parameters<typeof …>`, which instantiates them at their
  // constraints: `functionName` widens to `string`, `args` to `unknown[]`, and
  // a payable call's `value` collapses to `undefined`. Forwarding them keeps
  // each call site checked against the ABI it actually passes.
  const send = useCallback(
    async <
      const abi extends Abi | readonly unknown[],
      functionName extends ContractFunctionName<abi, "nonpayable" | "payable">,
      args extends ContractFunctionArgs<abi, "nonpayable" | "payable", functionName>,
      chainId extends Config["chains"][number]["id"],
    >(
      request: WriteContractVariables<abi, functionName, args, Config, chainId>,
    ) => {
      setPhase("signing");
      try {
        // The one cast in here. TypeScript can't prove that a still-unresolved
        // `WriteContractVariables<abi, …>` satisfies the same type once wagmi
        // distributes it over its payable/nonpayable union, even though the two
        // are the same by construction. Callers are fully checked against their
        // own ABI on the way in, which is where the safety actually matters.
        const hash = await writeContractAsync(
          request as Parameters<typeof writeContractAsync>[0],
        );
        setPhase("confirming");
        await publicClient?.waitForTransactionReceipt({
          hash,
          pollingInterval: RECEIPT_POLL_MS,
        });

        // Deliberately not awaited. The transaction is confirmed, so the caller
        // can tell the user right now; the refetches land a beat later and every
        // mounted screen — including the nav balance — updates itself. Awaiting
        // here would put the whole app's re-read in front of the success alert.
        void queryClient.invalidateQueries();

        return hash;
      } finally {
        setPhase("idle");
      }
    },
    [writeContractAsync, publicClient, queryClient],
  );

  return { send, phase, isBusy: phase !== "idle" };
}

/** Button label that tracks the phase, so a write never looks like it stalled. */
export function txLabel(phase: TxPhase, idle: string, done: string) {
  if (phase === "signing") return "Confirm in wallet…";
  if (phase === "confirming") return done;
  return idle;
}
