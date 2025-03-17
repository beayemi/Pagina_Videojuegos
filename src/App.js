import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/home';
import GameDetail from './components/gamedetail';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
// ...Navbar import eliminado...

function App() {
  return (
    <Router>
      {/* Navbar removida */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<GameDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
