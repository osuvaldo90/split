import { useEffect, useState } from "react";

interface JoinToastProps {
  name: string;
  onDismiss: () => void;
}

export default function JoinToast({ name, onDismiss }: JoinToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for fade out animation before calling onDismiss
      setTimeout(onDismiss, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm shadow-sm">
        <span className="font-medium">{name}</span> joined
      </div>
    </div>
  );
}
