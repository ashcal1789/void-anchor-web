import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

const logDetailedError = (error: unknown, context: string) => {
  console.error(`[${context}] Full error object:`, error);
  if (error instanceof TRPCClientError) {
    console.error(`[${context}] TRPCClientError message:`, error.message);
    console.error(`[${context}] TRPCClientError data:`, (error as any).data);
  } else if (error instanceof Error) {
    console.error(`[${context}] Error name:`, error.name);
    console.error(`[${context}] Error message:`, error.message);
    console.error(`[${context}] Error stack:`, error.stack);
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    logDetailedError(error, "API Query Error");
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    logDetailedError(error, "API Mutation Error");
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        console.log("[tRPC Fetch] URL:", input);
        console.log("[tRPC Fetch] Init:", init);
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        }).then(response => {
          console.log("[tRPC Fetch] Response status:", response.status);
          console.log("[tRPC Fetch] Response headers:", response.headers);
          return response;
        }).catch(error => {
          console.error("[tRPC Fetch] Network error:", error);
          console.error("[tRPC Fetch] Error name:", error.name);
          console.error("[tRPC Fetch] Error message:", error.message);
          throw error;
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
