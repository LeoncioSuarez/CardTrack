import React, { useState } from 'react';
import { useAuth } from '../AuthContext'; 

const LoginRegister = () => {
    const { login, register } = useAuth(); 
    const [isLogin, setIsLogin] = useState(true); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); 
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        let success;
        if (isLogin) {
            success = login(email, password);
            if (!success) {
                setError("Credenciales inválidas. Usa test@kanban.com y 123456");
            }
        } else {
            success = register(name, email, password);
            if (!success) {
                 setError("Error al registrar. Prueba con test@kanban.com y 123456");
            }
        }
    };

    return (
        <div className="auth-container">
            <div className="main-card auth-card">
                <h2 className="auth-title">{isLogin ? "Iniciar Sesión" : "Registrarse"}</h2>

                {error && <p className="error-text">{error}</p>}

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Nombre Completo"
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
                    <button type="submit" className="main-button auth-button">
                        {isLogin ? "Entrar" : "Crear Cuenta"}
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