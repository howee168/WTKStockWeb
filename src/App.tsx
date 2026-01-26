import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/features/Dashboard';
import InventoryList from './components/features/InventoryList';
import GRN from './components/features/Transactions/GRN';
import MRRF from './components/features/Transactions/MRRF';
import StockCard from './components/features/Reports/StockCard';
import StockList from './components/features/Reports/StockList';
import './styles/global.css';

import { InventoryProvider } from './context/InventoryContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <InventoryProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<InventoryList />} />
              <Route path="grn" element={<GRN />} />
              <Route path="mrrf" element={<MRRF />} />
              <Route path="reports" element={<StockCard />} />
              <Route path="stock-list" element={<StockList />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </InventoryProvider>
  );
}

export default App;
