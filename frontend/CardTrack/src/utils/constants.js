// Centraliza la URL base del API, limpia barras finales y usa VITE_API_BASE_URL si existe.
const _raw = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
export const API_BASE_URL = _raw.replace(/\/+$/g, '');

// Export adicional por compatibilidad si hace falta en otras partes
export default API_BASE_URL;
export const MOCK_USER = {
    name: "Test User",
    email: "test@kanban.com",
    registrationDate: "2023-01-15",
    lastLogin: new Date().toLocaleString(),
};