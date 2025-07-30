import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MarketsPage from './pages/MarketsPage';
import MacroPage from './pages/MacroPage';
import CommoditiesPage from './pages/CommoditiesPage';
import BondsRiskPage from './pages/BondsRiskPage';
import StocksPage from './pages/StocksPage';
import StockDetailPage from './components/stocks/StockDetailPage';
import CurrencyPage from './pages/CurrencyPage';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
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
              <Route path="/currency" element={<CurrencyPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
