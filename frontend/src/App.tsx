import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider, useAuth} from './useAuth.tsx';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import NavBar from "./NavBar";
import HomePage from './HomePage';
import RoomDetailPage from './RoomDetailPage';
import './App.css';

const AppContent = () => {
  const {ready: authReady, accessToken} = useAuth();
  if (!authReady) {
    return <div>Authenticating...</div>;
  }

  if (!accessToken) {
    return (
      <div className="container">
        <Routes>
          <Route path="/" element={<LoginPage/>}/>
          <Route path="/signup" element={<SignupPage/>}/>
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </div>
    );
  }

  return (
    <div className="container">
      <NavBar/>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/:roomId" element={<RoomDetailPage/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent/>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
