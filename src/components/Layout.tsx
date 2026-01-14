import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first container - max width for tablet/desktop */}
      <div className="mx-auto max-w-md min-h-screen bg-white shadow-sm">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Split</h1>
        </header>

        {/* Main content area */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
