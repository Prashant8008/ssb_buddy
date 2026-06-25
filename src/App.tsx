import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Feed from './pages/Feed';
import SSBHub from './pages/SSBHub';
import FitnessTracker from './pages/mobile/FitnessTracker';
import LocalityMap from './pages/LocalityMap';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ChatPage from './pages/ChatPage';
import AIMentor from './pages/mobile/AIMentor';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Groups from './pages/Groups';
import Events from './pages/Events';
import PPDTPractice from './pages/ssb/PPDTPractice';
import TATPractice from './pages/ssb/TATPractice';
import WATPractice from './pages/ssb/WATPractice';
import SRTPractice from './pages/ssb/SRTPractice';
import Connections from './pages/Connections';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <MainLayout>
              <Routes>
                <Route path="/" element={<Feed />} />
                <Route path="/ssb" element={<SSBHub />} />
                <Route path="/ssb/ppdt" element={<PPDTPractice />} />
                <Route path="/ssb/tat" element={<TATPractice />} />
                <Route path="/ssb/wat" element={<WATPractice />} />
                <Route path="/ssb/srt" element={<SRTPractice />} />
                <Route path="/fitness" element={<FitnessTracker />} />
                <Route path="/map" element={<LocalityMap />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/connections" element={<Connections />} />
                <Route path="/settings/*" element={<Settings />} />
                <Route path="/ai-mentor" element={<AIMentor />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/events" element={<Events />} />
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
