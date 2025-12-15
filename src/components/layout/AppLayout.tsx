import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Breadcrumb } from "./Breadcrumb";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-16">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-surface px-6">
          <Breadcrumb />
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
