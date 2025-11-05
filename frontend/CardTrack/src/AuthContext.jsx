import React, { useState, useEffect, createContext } from 'react';
import { API_BASE_URL } from './utils/constants.js';

export const AuthContext = createContext();

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
            const response = await fetch(`${API_BASE_URL}/users/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok && data.token) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setUser({
                    id: data.user_id,
                    name: data.name,
                    email: data.email
                });
                setIsAuthenticated(true);
                setLoading(false);
                return { success: true };
            } else {
                setError(data.error || 'Credenciales inválidas.');
                setUser(null);
                setIsAuthenticated(false);
                setLoading(false);
                return { success: false, error: data.error || 'Credenciales inválidas.' };
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
            setLoading(false);
            return { success: false, error: 'Error de conexión con el servidor.' };
        }
    };

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
                return login(email, password);
            } else {
                setError(data.email ? 'El correo ya existe.' : data.error || 'Error de registro.');
                setLoading(false);
                return { success: false, error: data.email ? 'El correo ya existe.' : data.error || 'Error de registro.' };
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
            setLoading(false);
            return { success: false, error: 'Error de conexión con el servidor.' };
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
            const boardResponse = await fetch(`${API_BASE_URL}/boards/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    title: boardName,
                    user: user.id,
                    description: ''
                })
            });

            if (!boardResponse.ok) {
                const errorData = await boardResponse.json();
                let apiError = 'Fallo al crear el tablero.';

                if (errorData.user && Array.isArray(errorData.user)) {
                    apiError = `Error en el campo 'user': ${errorData.user.join(', ')}`;
                } else if (errorData.detail) {
                    apiError = errorData.detail;
                } else if (errorData.title) {
                    apiError = `Error en el campo 'title': ${errorData.title.join(', ')}`;
                } else if (errorData.description) {
                    apiError = `Error en el campo 'description': ${errorData.description.join(', ')}`;
                }

                throw new Error(apiError);
            }

            const board = await boardResponse.json();

            const columnRequests = columns.map((title, index) =>
                fetch(`${API_BASE_URL}/boards/${board.id}/columns/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    },
                    body: JSON.stringify({ title, position: index, board: board.id })
                })
            );
            await Promise.all(columnRequests);

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
            fetch(`${API_BASE_URL}/users/me/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${storedToken}`
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
                            last_login: data.last_login,
                            // Use absolute URL from serializer if provided
                            profilepicture_url: data.profilepicture_url || data.profilepicture || null,
                        });
                    } else {
                        logout();
                    }
                })
                .catch(() => logout());
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, register, logout, createBoard, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
};