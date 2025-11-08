import { useContext } from 'react';
// Use the centralized context from the `context` folder so all components
// reference the same context instance (avoids duplicate contexts).
import { AuthContext } from './context/AuthContext.jsx';

export const useAuth = () => useContext(AuthContext);