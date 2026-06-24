import { Suspense } from "react";
import { PostHogProvider, PostHogPageView } from "@/components/providers/PostHogProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PostHogProvider>
  );
}
