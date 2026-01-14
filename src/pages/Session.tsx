import { useParams } from "react-router-dom";

export default function Session() {
  const { code } = useParams<{ code: string }>();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Session: {code}</h1>
      <p className="text-gray-600 mt-2">Session view placeholder</p>
    </div>
  );
}
