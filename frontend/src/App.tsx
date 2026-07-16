import { NavLink, Route, Routes } from "react-router-dom";
import CurrentStatusPage from "./pages/CurrentStatusPage";
import HistoryPage from "./pages/HistoryPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportsPage from "./pages/ReportsPage";
import { useTheme } from "./context/ThemeContext";

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">Умный мониторинг комфорта</span>
        <nav className="app-nav">
          <NavLink to="/" end>
            Главная
          </NavLink>
          <NavLink to="/history">История</NavLink>
          <NavLink to="/analytics">Аналитика</NavLink>
          <NavLink to="/reports">Отчёты</NavLink>
        </nav>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Переключить тему"
          title="Светлая/тёмная тема"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<CurrentStatusPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </main>
    </div>
  );
}
