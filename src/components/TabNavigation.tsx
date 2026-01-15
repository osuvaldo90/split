type Tab = "items" | "taxtip" | "summary";

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  unclaimedCount?: number;
}

// Simple icons as SVG components
function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    </svg>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

export default function TabNavigation({
  activeTab,
  onTabChange,
  unclaimedCount = 0,
}: TabNavigationProps) {
  const tabs: { id: Tab; label: string; Icon: typeof ListIcon }[] = [
    { id: "items", label: "Items", Icon: ListIcon },
    { id: "taxtip", label: "Tax & Tip", Icon: CalculatorIcon },
    { id: "summary", label: "Summary", Icon: UsersIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {id === "items" && unclaimedCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unclaimedCount}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 ${isActive ? "font-medium" : ""}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
