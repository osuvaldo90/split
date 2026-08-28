import { useEffect, useRef } from "react";

interface DeleteBillDialogProps {
  billLabel: string;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteBillDialog({
  billLabel,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}: DeleteBillDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // showModal() puts the dialog in the top layer, which is what makes the
  // rest of the page genuinely inert: focus is trapped, background content
  // is hidden from screen readers, and focus returns to the delete button
  // on close. Doing that by hand is a lot of code to get subtly wrong.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  // Escape fires "cancel" on a modal dialog. Always preventDefault so React
  // state stays the single source of truth for whether we are open, and
  // ignore it entirely while the delete is in flight.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleCancel(e: Event) {
      e.preventDefault();
      if (!isDeleting) {
        onCancel();
      }
    }

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [isDeleting, onCancel]);

  // A click on the backdrop is reported as a click on the dialog itself, so
  // fall back to hit-testing the panel's own box.
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (isDeleting || e.target !== e.currentTarget) return;

    const { top, left, right, bottom } =
      e.currentTarget.getBoundingClientRect();
    const isOutside =
      e.clientX < left ||
      e.clientX > right ||
      e.clientY < top ||
      e.clientY > bottom;

    if (isOutside) {
      onCancel();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby="delete-bill-title"
      aria-describedby="delete-bill-description"
      className="m-auto w-[calc(100%_-_2rem)] max-w-sm max-h-[90dvh] overflow-y-auto rounded-lg bg-white p-5 backdrop:bg-black/80"
    >
      <h2 id="delete-bill-title" className="text-lg font-semibold">
        Delete this bill?
      </h2>
      <p id="delete-bill-description" className="mt-2 text-sm text-gray-600">
        <span className="font-medium">{billLabel}</span> will be deleted for
        everyone in it, along with all items, claims, and the receipt photo.
        This can't be undone.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="flex-1 min-h-[44px] px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex-1 min-h-[44px] px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </dialog>
  );
}
