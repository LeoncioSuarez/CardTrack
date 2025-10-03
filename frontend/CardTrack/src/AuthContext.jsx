// src/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from "react";
// Importa desde ./utils/
import { MOCK_USER } from "./utils/constants";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Simulamos la verificación de un token o sesión persistente al inicio
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('isAuthenticated') === 'true'
    );
    const [user, setUser] = useState(
        isAuthenticated ? MOCK_USER : null
    );

    // Persistencia del estado en localStorage
    useEffect(() => {
        if (isAuthenticated) {
            localStorage.setItem('isAuthenticated', 'true');
            if (!user) {
                 // Si está autenticado pero el usuario no está cargado (p. ej., después de un F5)
                setUser(MOCK_USER);
            }
        } else {
            localStorage.removeItem('isAuthenticated');
        }
    }, [isAuthenticated, user]);

    // Función de Login simulada
    const login = (email, password) => {
        if (email === "test@kanban.com" && password === "123456") {
            setUser(MOCK_USER);
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    // Función de Registro simulada
    const register = (name, email, password) => {
        // En un proyecto real, esto llamaría al backend de Django para crear el usuario
        // Por ahora, simplemente simulamos el éxito
        return login(email, password);
    };

    // Función de Logout
    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
    return useContext(AuthContext);
};