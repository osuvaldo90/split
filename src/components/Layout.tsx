import { Outlet } from "react-router-dom";
import ConnectionStatus from "./ConnectionStatus";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Connection status indicator - shows when disconnected */}
      <ConnectionStatus />

      {/* Mobile-first container - max width for tablet/desktop */}
      <div className="mx-auto max-w-md min-h-screen bg-white shadow-sm">
        {/* Main content area */}
        <main className="pb-safe">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
