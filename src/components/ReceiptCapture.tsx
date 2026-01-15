import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ReceiptCaptureProps {
  sessionId: Id<"sessions">;
  onUpload: (storageId: Id<"_storage">) => void;
  disabled?: boolean;
}

export default function ReceiptCapture({
  sessionId,
  onUpload,
  disabled = false,
}: ReceiptCaptureProps) {
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.receipts.generateUploadUrl);
  const saveReceiptImage = useMutation(api.receipts.saveReceiptImage);

  async function handleFileSelect(file: File) {
    setIsUploading(true);
    try {
      // Step 1: Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Step 2: POST file to the upload URL
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();

      // Step 3: Save the storage ID to the session
      await saveReceiptImage({ sessionId, storageId });

      // Notify parent component
      onUpload(storageId);
    } catch (error) {
      console.error("Receipt upload failed:", error);
    } finally {
      setIsUploading(false);
      // Reset file inputs after upload (success or failure)
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }

  const isDisabled = disabled || isUploading;

  return (
    <div className="flex flex-col gap-2">
      {/* Camera input - uses capture="environment" to open camera directly on Android */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />

      {/* Gallery input - no capture attribute, opens file picker/gallery */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />

      {/* Two buttons for explicit camera vs gallery choice - works on all platforms */}
      <div className="flex gap-2">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isDisabled}
          className="flex-1 bg-blue-500 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          {isUploading ? "Uploading..." : "Take Photo"}
        </button>
        <button
          onClick={() => galleryInputRef.current?.click()}
          disabled={isDisabled}
          className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          {isUploading ? "Uploading..." : "Choose Image"}
        </button>
      </div>
    </div>
  );
}
