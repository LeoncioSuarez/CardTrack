

import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext.js';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    // Login
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok && data.token) {
                localStorage.setItem('token', data.token);
                setUser({
                    id: data.user_id,
                    name: data.name,
                    email: data.email
                });
                setIsAuthenticated(true);
                return { success: true };
            } else {
                setError(data.error || 'Credenciales inválidas.');
                setUser(null);
                setIsAuthenticated(false);
                return { success: false, error: data.error || 'Credenciales inválidas.' };
            }
        } catch {
            setError('No se pudo conectar con el servidor.');
            setUser(null);
            setIsAuthenticated(false);
            return { success: false, error: 'No se pudo conectar con el servidor.' };
        } finally {
            setLoading(false);
        }
    };

    // Registro
    const register = async (name, email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/users/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true };
            } else {
                setError(data.email ? `Email: ${data.email[0]}` : (data.detail || 'Error desconocido al registrar.'));
                return { success: false, error: data.email ? `Email: ${data.email[0]}` : (data.detail || 'Error desconocido al registrar.') };
            }
        } catch {
            setError('No se pudo conectar con el servidor.');
            return { success: false, error: 'No se pudo conectar con el servidor.' };
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    // Crear tablero 
    const createBoard = async (boardData) => {
        const token = localStorage.getItem('token');
        if (!token) return { success: false, error: 'No autenticado. Por favor, inicia sesión.' };
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/boards/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(boardData)
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, board: data };
            } else {
                setError(data.detail || 'Error al crear el tablero. Verifica los datos.');
                return { success: false, error: data.detail || 'Error al crear el tablero. Verifica los datos.' };
            }
        } catch {
            setError('No se pudo conectar con el servidor.');
            return { success: false, error: 'No se pudo conectar con el servidor.' };
        } finally {
            setLoading(false);
        }
    };

    // Al cargar, intenta recuperar usuario si hay token 
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            // Fetch datos completos del usuario
            fetch(`${API_BASE_URL}/users/me/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                }
            })
            .then(res => res.json())
            .then(data => {
                if (!data.error) {
                    setUser({
                        id: data.id,
                        name: data.name,
                        email: data.email,
                        registration_date: data.registration_date || data.date_joined,
                        last_login: data.last_login
                    });
                }
            });
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, createBoard, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};