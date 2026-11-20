import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Shop from "./pages/Shop";
import Menu from "./pages/Menu";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import LockerSurvey from "./pages/LockerSurvey";
// import Training from "./pages/Training"; // LOCKED FOR NOW

export default function App() {
  const token = localStorage.getItem("token");

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/locker-survey" element={<LockerSurvey />} />
        {/* LOCKED FOR NOW - uncomment to re-enable the workout page */}
        {/* <Route path="/x/iron-7k2q" element={<Training />} /> */}
        <Route path="/x/iron-7k2q" element={<p style={{ padding: "2rem", textAlign: "center" }}>🔒 Locked for now</p>} />
        <Route path="/admin" element={token ? <Admin /> : <Navigate to="/login" />} />
      </Routes>
    </ThemeProvider>
  );
}
