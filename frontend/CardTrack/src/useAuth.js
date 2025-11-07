import { useContext } from 'react';
import { AuthContext } from './AuthContext.jsx';

const _noProvider = {
	isAuthenticated: false,
	user: null,
	token: null,
	// Friendly fallback messages (Spanish) so UI shows a helpful prompt instead of a raw technical string
	login: async () => ({ success: false, error: 'No estás autenticado. Inicia sesión para continuar.' }),
	register: async () => ({ success: false, error: 'No estás autenticado. Inicia sesión para continuar.' }),
	logout: () => {},
	createBoard: async () => ({ success: false, error: 'No estás autenticado. Inicia sesión para crear tableros.' }),
	loading: false,
	// keep this null so components don't render a global auth error unintentionally
	error: null,
	refreshUser: async () => {},
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	return ctx || _noProvider;
};