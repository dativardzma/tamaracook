import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Shop from "./pages/Shop";
import Menu from "./pages/Menu";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import LockerSurvey from "./pages/LockerSurvey";

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/locker-survey" element={<LockerSurvey />} />
        <Route path="/admin" element={token ? <Admin /> : <Navigate to="/login" />} />
      </Routes>
    </ThemeProvider>
  );
}
