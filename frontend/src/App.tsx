import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Forecasts from "./pages/Forecasts";
import ForecastDetail from "./pages/ForecastDetail";
import Promotions from "./pages/Promotions";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <ProtectedRoute>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/forecasts" element={<Forecasts />} />
        <Route path="/forecasts/:id" element={<ForecastDetail />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ProtectedRoute>
  </BrowserRouter>
);

export default App;
