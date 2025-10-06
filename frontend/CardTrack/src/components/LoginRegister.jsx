import React, { useState } from 'react';
import { useAuth } from '../useAuth.js';

const LoginRegister = () => {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        let result;

        try {
            if (isLogin) {
                result = await login(email, password);
            } else {
                result = await register(name, email, password);
            }

            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Error de comunicación con el servidor. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-card">
                <h2 className="auth-title">
                    {isLogin ? "Iniciar Sesión" : "Registrarse"}
                </h2>

                {error && <p className="error-message">{error}</p>}
                
                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Nombre de Usuario"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="auth-input"
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Correo Electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="auth-input"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="auth-input"
                        required
                    />
                    <button type="submit" className="main-button auth-button" disabled={isLoading}>
                        {isLoading ? "Cargando..." : (isLogin ? "Entrar" : "Crear Cuenta")}
                    </button>
                </form>

                <p
                    className="auth-toggle-text"
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError('');
                        setEmail('');
                        setPassword('');
                        setName('');
                    }}
                >
                    {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia Sesión"}
                </p>
            </div>
        </div>
    );
};

export default LoginRegister;