import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: El Login */}
        <Route path="/" element={<Login />} />
        
        {/* Ruta interna: El Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Si alguien escribe una ruta que no existe, lo regresamos al login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;