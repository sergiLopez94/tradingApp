import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Portfolio from './components/Portfolio';
import History from './components/History';
import Client from './components/Client';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/history" element={<History />} />
        <Route path="/client" element={<Client />} />
      </Routes>
    </Router>
  );
}

export default App;
