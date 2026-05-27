import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './useAuth.tsx';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import NavBar from "./NavBar";
import HomePage from '@/HomePage/HomePage.tsx';
import RoomDetailPage from './RoomDetailPage';
import './App.css';

const AppContent = () => {
  const { ready: authReady, accessToken } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return <div>Authenticating...</div>;
  }

  if (!accessToken) {
    return (
      <div className='container'>
        <Routes>
          <Route path="/" element={<LoginPage/>}/>
          <Route path="/signup" element={<SignupPage/>}/>
          <Route path="*" element={<Navigate to="/" replace state={{ from: location.pathname + location.search }}/>}/>
        </Routes>
      </div>
    );
  }

  return (
    <div className='container'>
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
