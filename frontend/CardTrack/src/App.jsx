import React from 'react';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';

import { AuthProvider, useAuth } from './AuthContext';
import { COLORS } from './utils/styles'; 


const AppRouter = () => {
    const { isAuthenticated } = useAuth();
    
    const appStyle = {
        minHeight: '100vh',
        backgroundColor: COLORS.PRIMARY_BACKGROUND,
    };

    return (
        <div style={appStyle}>
            {isAuthenticated ? <Dashboard /> : <LoginRegister />}
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