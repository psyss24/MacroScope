import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MarketsPage from './pages/MarketsPage';
import MacroPage from './pages/MacroPage';
import CommoditiesPage from './pages/CommoditiesPage';
import BondsRiskPage from './pages/BondsRiskPage';
import StocksPage from './pages/StocksPage';
import StockDetailPage from './components/stocks/StockDetailPage';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';

// Component to handle 404 redirects
function RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have a stored redirect path from 404.html
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      sessionStorage.removeItem('redirectPath');
      // Remove the /MacroScope prefix if it exists in the stored path
      const cleanPath = redirectPath.replace('/MacroScope', '') || '/';
      // Only navigate if we're currently on the root path to avoid infinite loops
      if (location.pathname === '/') {
        navigate(cleanPath, { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <Router basename="/MacroScope">
        <div className="App">
          <RedirectHandler />
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/markets" element={<MarketsPage />} />
              <Route path="/macro" element={<MacroPage />} />
              <Route path="/commodities" element={<CommoditiesPage />} />
              <Route path="/bonds" element={<BondsRiskPage />} />
              <Route path="/risk" element={<BondsRiskPage />} />
              <Route path="/stocks" element={<StocksPage />} />
              <Route path="/stocks/:symbol" element={<StockDetailPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
