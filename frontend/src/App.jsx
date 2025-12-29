import { BrowserRouter, Routes, Route } from "react-router-dom";
import EquipmentList from "./pages/EquipmentList";
import EquipmentDetail from "./pages/EquipmentDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EquipmentList />} />
        <Route path="/equipment/:id" element={<EquipmentDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
