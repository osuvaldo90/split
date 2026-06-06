import { useParams } from "react-router";
import QRCode from "react-qr-code";

export default function QrCode() {
  const { code } = useParams<{ code: string }>();
  const shareUrl = `${window.location.origin}/bill/${code}`;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] pb-24 px-8">
      <QRCode value={shareUrl} size={240} />
    </div>
  );
}
