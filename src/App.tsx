import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Web3Provider } from './contexts/Web3Context';
import theme from './theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import TenderDetails from './pages/TenderDetails';
import CreateTender from './pages/CreateTender';
import UserDashboard from './pages/UserDashboard';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    <Web3Provider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tender/:id" element={<TenderDetails />} />
              <Route path="/create" element={<CreateTender />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Web3Provider>
  );
};

export default App; 