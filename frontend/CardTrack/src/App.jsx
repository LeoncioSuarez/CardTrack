import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoginRegister, Dashboard, BoardEditor, BoardsPreview, CreateBoard, Profile, Settings, Inicio } from './components';
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
