import type { ReactNode } from "react";

import { Header } from "@/components/layout/header";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="ui-skip-link" href="#main-content">本文へ移動</a>
      <Header />
      <main className="container page-shell" id="main-content">
        {children}
      </main>
    </div>
  );
}
