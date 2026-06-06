import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Layout from "./components/Layout";
import Items from "./components/Items";
import TaxTipSettings from "./components/TaxTipSettings";
import Summary from "./components/Summary";
import Home from "./pages/Home";
import Session from "./pages/Session";
import QrCode from "./pages/QrCode";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="bill/:code" element={<Session />}>
            <Route index element={<Navigate to={"items"} replace />} />
            <Route path="items" element={<Items />} />
            <Route path="taxtip" element={<TaxTipSettings />} />
            <Route path="summary" element={<Summary />} />
            <Route path="qr" element={<QrCode />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
