import { Routes, Route, Navigate } from "react-router-dom";
import Shop from "./pages/Shop";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/" element={<Shop />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={token ? <Admin /> : <Navigate to="/login" />} />
    </Routes>
  );
}
