import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ReceiptImageViewerProps {
  storageId: Id<"_storage">;
  onClose: () => void;
}

export default function ReceiptImageViewer({
  storageId,
  onClose,
}: ReceiptImageViewerProps) {
  const imageUrl = useQuery(api.receipts.getReceiptUrl, { storageId });

  // Handle click on overlay (close modal)
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={handleOverlayClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Loading state */}
      {imageUrl === undefined && (
        <div className="text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-3">Loading image...</p>
        </div>
      )}

      {/* Image not found */}
      {imageUrl === null && (
        <div className="text-white text-center">
          <p>Image not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Image display */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Receipt"
          className="max-w-[90vw] max-h-[85vh] object-contain"
        />
      )}
    </div>
  );
}
