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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
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
    <div className="flex flex-col gap-3">
      {/* Camera capture input (hidden) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraChange}
        className="hidden"
        disabled={isDisabled}
      />

      {/* File upload input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />

      {/* Take Photo button */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        disabled={isDisabled}
        className="w-full bg-blue-500 text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
      >
        {isUploading ? "Uploading..." : "Take Photo"}
      </button>

      {/* Upload Image button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isDisabled}
        className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors border border-gray-300"
      >
        {isUploading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
}
