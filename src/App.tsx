import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const status = useQuery(api.test.ping);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-gray-900">Split</h1>
      <p className="text-gray-600">
        {status ? `Convex: ${status.status}` : "Connecting..."}
      </p>
    </div>
  );
}

export default App;
