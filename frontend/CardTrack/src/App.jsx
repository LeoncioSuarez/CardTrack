import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import BoardEditor from './components/BoardEditor';
import BoardsPreview from './components/BoardsPreview';
import CreateBoard from './components/CreateBoard';
import Profile from './components/Profile';
import Settings from './components/Settings';
import { AuthProvider } from './AuthContext.jsx';
import { useAuth } from './useAuth.js';

const AuthenticatedRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Dashboard viewComponent={<BoardsPreview />} />} />
            <Route path="/boards/:boardId" element={<Dashboard viewComponent={<BoardEditor />} />} />
            <Route path="/create" element={<Dashboard viewComponent={<CreateBoard />} />} />
            <Route path="/profile" element={<Dashboard viewComponent={<Profile />} />} />
            <Route path="/settings" element={<Dashboard viewComponent={<Settings />} />} />
            <Route path="*" element={<Dashboard viewComponent={<BoardsPreview />} />} />
        </Routes>
    );
};

const AppRouter = () => {
    const { isAuthenticated, loading: authLoading } = useAuth();

    const appStyle = {
        minHeight: '100vh',
    };

    if (authLoading) {
        return <div style={appStyle}><h1 style={{ textAlign: 'center', paddingTop: '20vh' }}>Cargando...</h1></div>;
    }

    return (
        <div style={appStyle}>
            {isAuthenticated ? <AuthenticatedRoutes /> : <LoginRegister />}
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
};

export default App;
