import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import NotFound from "./pages/NotFoundPage";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoutes";
import MainLayout from "./layouts/MainLayout";
import ProfilePage from "./pages/ProfilePage";
import { useEffect } from "react";
import './styles/theme.css';
import { DEFAULT_PRIMARY_COLOR, DEFAULT_THEME } from "./constants/theme";
import Starred from "./pages/Starred";
import Trash from "./pages/Trash";
import Support from "./pages/Support";
import Notifications from "./pages/Notifications";
import Statistics from "./pages/Statistics";
import Groups from "./pages/Groups";
import Folderpage from "./pages/Folderpage";

// Helper function to calculate hover color
const getHoverColor = (hex) => {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  
  // Darken by 15%
  r = Math.max(0, r - 38);
  g = Math.max(0, g - 38);
  b = Math.max(0, b - 38);
  
  // Convert back to hex
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};



function App() {
  useEffect(() => {
    // Load saved theme or default
    const savedTheme = localStorage.getItem('theme') || DEFAULT_THEME;
    const savedColor = localStorage.getItem('primaryColor') || DEFAULT_PRIMARY_COLOR;
    const savedLight = localStorage.getItem('primaryLight')
    
    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.style.setProperty('--color-primary', savedColor);
    document.documentElement.style.setProperty('--color-primary-light', savedLight);
    document.documentElement.style.setProperty(
      '--color-primary-hover', 
      getHoverColor(savedColor)
    );
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes with MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/starred" element={<Starred />} />
            <Route path="/trash" element={<Trash />} />
            <Route path="/support" element={<Support />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/folder" element={<Folderpage />} />
          </Route>
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;