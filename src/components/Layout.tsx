import { Outlet } from "react-router";
import ConnectionStatus, {
  useConnectionBannerVisible,
} from "./ConnectionStatus";
import ThemePicker from "./ThemePicker";

export default function Layout() {
  const bannerVisible = useConnectionBannerVisible();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Connection status indicator - shows when disconnected */}
      <ConnectionStatus />

      {/*
        Tone picker - pinned to the top-right of the content column so it is
        reachable from every page. The wrapper ignores pointer events so it
        never blocks the page underneath, and drops below the connection
        banner while that banner is on screen.
      */}
      <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
        <div
          className={`mx-auto max-w-md flex justify-end px-2.5 pb-2.5 transition-[padding] ${
            bannerVisible ? "pt-11" : "pt-2.5"
          }`}
        >
          <ThemePicker />
        </div>
      </div>

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
