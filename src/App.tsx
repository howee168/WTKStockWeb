import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/features/Dashboard';
import InventoryList from './components/features/InventoryList';
import GRN from './components/features/Transactions/GRN';
import MRRF from './components/features/Transactions/MRRF';
import DemoTracker from './components/features/DemoTracker';
import StockCard from './components/features/Reports/StockCard';
import OverallStockCard from './components/features/Reports/OverallStockCard';
import StockList from './components/features/Reports/StockList';
import './styles/global.css';

import { InventoryProvider } from './context/InventoryContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './components/features/Auth/Login';

function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes Wrapper */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="inventory" element={<InventoryList />} />
                  <Route path="grn" element={<GRN />} />
                  <Route path="mrrf" element={<MRRF />} />
                  <Route path="demo" element={<DemoTracker />} />
                  <Route path="reports" element={<StockCard />} />
                  <Route path="overall-reports" element={<OverallStockCard />} />
                  <Route path="stock-list" element={<StockList />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </InventoryProvider>
    </AuthProvider>
  );
}

export default App;
