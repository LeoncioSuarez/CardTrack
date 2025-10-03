import React, { useState } from 'react';
import { useAuth } from '../useAuth.js';

const LoginRegister = () => {
    const { login, register } = useAuth(); 
    const [isLogin, setIsLogin] = useState(true); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); 
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Añadido para mejor UX

    // 1. Hacemos la función ASÍNCRONA
    const handleSubmit = async (e) => { 
        e.preventDefault();
        setError('');
        setIsLoading(true); // Bloquea el botón
        
        let result; // Usaremos un objeto para almacenar el resultado { success: bool, error: str }

        try {
            if (isLogin) {
                // 2. Usamos AWAIT para esperar la respuesta de Django
                result = await login(email, password); 
            } else {
                result = await register(name, email, password);
            }
            
            // 3. Verificamos el resultado devuelto por AuthContext
            if (!result.success) {
                // Mostramos el error devuelto por el backend
                setError(result.error);
            }

        } catch (err) {
            // Manejo de errores de red o inesperados
            setError('Error de comunicación con el servidor. Revisa tu red.');
            console.error(err);
        } finally {
            setIsLoading(false); // Desbloquea el botón
        }
        
        // Si el registro fue exitoso, cambiamos a la vista de Login
        if (!isLogin && result && result.success) {
            setIsLogin(true);
            setEmail('');
            setPassword('');
            setName('');
            alert('¡Registro exitoso! Por favor, inicia sesión.');
        }
    };

    return (
        <div className="auth-container">
            <div className="main-card auth-card">
                <h2 className="auth-title">{isLogin ? "Iniciar Sesión" : "Registrarse"}</h2>

                {/* Ahora 'error' contendrá el mensaje real de Django */}
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