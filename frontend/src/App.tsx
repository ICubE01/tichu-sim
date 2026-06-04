import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/useAuth.tsx';
import LoginPage from '@/LoginPage.tsx';
import SignupPage from '@/SignupPage.tsx';
import NavBar from "@/NavBar.tsx";
import HomePage from '@/HomePage/HomePage.tsx';
import RoomDetailPage from '@/RoomDetailPage.tsx';
import './App.css';

const AdminPage = lazy(() => import('@/AdminPage.tsx'));
const ImpersonationOverlay = lazy(() => import('@/ImpersonationOverlay.tsx'));

const AppContent = () => {
  const { ready: authReady, accessToken, user } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return <div>Authenticating...</div>;
  }

  if (!accessToken) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
        <Route path="*" element={<Navigate to="/" replace state={{ from: location.pathname + location.search }}/>}/>
      </Routes>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <ImpersonationOverlay/>
      </Suspense>
      <NavBar/>
      <div className='container'>
        <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/rooms/:roomId" element={<RoomDetailPage/>}/>
          {user?.role === 'ADMIN' && (
            <Route path="/admin" element={<Suspense fallback={<div>Loading...</div>}>
              <AdminPage/>
            </Suspense>}/>
          )}
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </div>
    </>
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
