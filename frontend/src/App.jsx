import { BrowserRouter, Routes, Route } from "react-router-dom";
import EquipmentList from "./pages/EquipmentList";
import EquipmentDetail from "./pages/EquipmentDetail";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EquipmentList />} />
        <Route path="/equipment/:id" element={<EquipmentDetail />} />
        <Route path="/dashboard" element = {<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
