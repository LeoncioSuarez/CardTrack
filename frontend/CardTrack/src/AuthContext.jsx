import React, { useState, useEffect, createContext } from 'react';

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
            const response = await fetch(`${API_BASE_URL}/users/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok && data.token) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setIsAuthenticated(true);
                // refresh full user data from /users/me/
                await refreshUser(data.token, { id: data.user_id, name: data.name, email: data.email });
                setLoading(false);
                return { success: true };
            } else {
                setError(data.error || 'Credenciales inválidas.');
                setUser(null);
                setIsAuthenticated(false);
                setLoading(false);
                return { success: false, error: data.error || 'Credenciales inválidas.' };
            }
        } catch {
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
                const res = await login(email, password);
                // ensure user refreshed by login
                return res;
            } else {
                setError(data.email ? 'El correo ya existe.' : data.error || 'Error de registro.');
                setLoading(false);
                return { success: false, error: data.email ? 'El correo ya existe.' : data.error || 'Error de registro.' };
            }
        } catch {
            setError('Error de conexión con el servidor.');
            setLoading(false);
            return { success: false, error: 'Error de conexión con el servidor.' };
        }
    };

    const refreshUser = async (overrideToken = null, seedUser = null) => {
        const usedToken = overrideToken || token || localStorage.getItem('token');
        if (!usedToken) return;
        try {
            const res = await fetch(`${API_BASE_URL}/users/me/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${usedToken}`
                }
            });
            const data = await res.json();
            if (!data.error) {
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
            } else {
                // logout if token invalid
                logout();
            }
        } catch (err) {
            // keep previous user if network error; do not logout
            console.error('refreshUser error', err);
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