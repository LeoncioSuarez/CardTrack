import React, { useState, useEffect, createContext } from 'react';
import * as authApi from './utils/authApi';
import * as boardApi from './utils/boardApi';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authApi.login(email, password);
            if (data && data.token) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setIsAuthenticated(true);
                await refreshUser(data.token, { id: data.user_id, name: data.name, email: data.email });
                setLoading(false);
                return { success: true };
            }
            setLoading(false);
            return { success: false, error: 'Login failed' };
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor.');
            setLoading(false);
            return { success: false, error: err.message || 'Error de conexión con el servidor.' };
        }
    };

    const register = async (name, email, password) => {
        setLoading(true);
        setError(null);
        try {
            await authApi.register(name, email, password);
            // after register, login to refresh user
            const res = await login(email, password);
            return res;
        } catch (err) {
            setError(err.message || 'Error de registro.');
            setLoading(false);
            return { success: false, error: err.message || 'Error de registro.' };
        }
    };

    const refreshUser = async (overrideToken = null, seedUser = null) => {
        const usedToken = overrideToken || token || localStorage.getItem('token');
        if (!usedToken) return;
        try {
            const data = await authApi.getMe(usedToken);
            setUser({
                id: data.id || (seedUser && seedUser.id),
                name: data.name || (seedUser && seedUser.name),
                email: data.email || (seedUser && seedUser.email),
                profilepicture: data.profilepicture,
                aboutme: data.aboutme,
                registration_date: data.registration_date || data.date_joined,
                last_login: data.last_login
            });
            setIsAuthenticated(true);
        } catch (err) {
            console.error('refreshUser error', err);
            // Only logout on explicit 401 Unauthorized; for network errors keep the token
            // and show a non-fatal error so the UI can operate in offline/read-only mode.
            if (err && err.status === 401) {
                logout();
            } else {
                setError(err.message || 'No se pudo conectar al servidor.');
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
        setError(null);
    };

    const createBoard = async (boardName, columns) => {
        setLoading(true);
        setError(null);

        if (!user || !user.id || !token) {
            const errMsg = 'Error de autenticación: Los datos del usuario no están disponibles.';
            setError(errMsg);
            setLoading(false);
            return { success: false, error: errMsg };
        }

        try {
            const board = await boardApi.createBoard(boardName, token, columns);
            setLoading(false);
            return { success: true, board };
        } catch (err) {
            setError('No se pudo crear el tablero. Detalles: ' + err.message);
            setLoading(false);
            return { success: false, error: 'No se pudo crear el tablero. ' + err.message };
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
            // Use centralized refreshUser so profilepicture and other fields are normalized the same way
            (async () => {
                try {
                    await refreshUser(storedToken);
                } catch {
                    logout();
                }
            })();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, register, logout, createBoard, loading, error, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};