import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Generator } from './pages/Generator';
import { Containers } from './pages/Containers';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/generator" replace />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/containers" element={<Containers />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
