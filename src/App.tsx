import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Session from "./pages/Session";

function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="bill/:code" element={<Session />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
