import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Session from "./pages/Session";
import Join from "./pages/Join";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="session/:code" element={<Session />} />
          <Route path="join" element={<Join />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
