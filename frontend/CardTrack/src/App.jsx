import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import BoardEditor from './components/BoardEditor';
import BoardsPreview from './components/BoardsPreview';
import CreateBoard from './components/CreateBoard';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Inicio from './components/Inicio';
import Development from './components/Development';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import { useContext } from 'react';

const AuthenticatedRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Dashboard viewComponent={<Inicio />} />} />
            <Route path="/boards" element={<Dashboard viewComponent={<BoardsPreview />} />} />
            <Route path="/create" element={<Dashboard viewComponent={<CreateBoard />} />} />
            <Route path="/profile" element={<Dashboard viewComponent={<Profile />} />} />
            <Route path="/settings" element={<Dashboard viewComponent={<Settings />} />} />
            <Route path="/boards/:boardId" element={<Dashboard viewComponent={<BoardEditor />} />} />
            <Route path="/development" element={<Dashboard viewComponent={<Development />} />} />
        </Routes>
    );
};

const AppRouter = () => {
    const { isAuthenticated } = useContext(AuthContext);

    return (
        <Routes>
            {!isAuthenticated ? (
                <Route path="*" element={<LoginRegister />} />
            ) : (
                <Route path="*" element={<AuthenticatedRoutes />} />
            )}
        </Routes>
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
