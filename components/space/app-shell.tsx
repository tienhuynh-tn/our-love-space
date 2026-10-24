import type { ReactNode } from "react";
import { BottomNavigation, DesktopNavigation } from "@/components/space/navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh w-full max-w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(244,196,171,0.34),transparent_32rem),linear-gradient(135deg,#fff8f1_0%,#f3efe8_45%,#e6eee9_100%)] text-stone-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(178,107,85,0.24),transparent_30rem),linear-gradient(135deg,#17110f_0%,#0f1211_46%,#151819_100%)] dark:text-stone-50">
      <div className="mx-auto flex min-h-dvh w-full max-w-full lg:grid lg:max-w-7xl lg:grid-cols-[17rem_minmax(0,1fr)]">
        <DesktopNavigation />
        <div className="relative flex min-h-dvh min-w-0 flex-1 flex-col">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/35 to-transparent dark:from-white/[0.04]" />
          <main className="relative min-w-0 flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
