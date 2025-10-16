import React, { useState, useEffect } from 'react';
import { useAuth } from '../useAuth.js';
import { useNavigate } from 'react-router-dom';

const API_GALLERY_URL = 'http://127.0.0.1:8000/api/carousel-images/';

const LoginRegister = () => {
    const { login, register, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [images, setImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await fetch(API_GALLERY_URL);
                if (response.ok) {
                    let data = await response.json();
                    if (Array.isArray(data)) {
                        data = data
                            .filter(item => item.is_active)
                            .sort((a, b) => (a.position || 0) - (b.position || 0));
                    }
                    setImages(data);
                } else {
                    console.error("No se pudieron cargar las imágenes del carrusel.");
                }
            } catch (error) {
                console.error("Error al conectar con la API de galería:", error);
            }
        };

        fetchImages();
    }, []);

    useEffect(() => {
        if (images.length > 0) {
            const interval = setInterval(() => {
                setCurrentImageIndex(prevIndex => (prevIndex + 1) % images.length);
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [images.length]);

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
        } catch (error) {
            console.error('Error en login/register:', error);
            setError('Error de comunicación con el servidor. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const currentImageUrl = images.length > 0 
        ? (images[currentImageIndex].image_url || images[currentImageIndex].image || images[currentImageIndex].url)
        : null;

    return (
        <div className="auth-page-container">
            <div className="auth-presentation-column">
                <h1 className="presentation-title-1">Bienvenido a cardtrack</h1>
                <h2 className="presentation-title-2">tu editor kanban de confianza</h2>

                <div className="gallery-container">
                    {currentImageUrl ? (
                        <>
                            <img 
                                src={currentImageUrl} 
                                alt={images[currentImageIndex].alt_text || `Slide ${currentImageIndex + 1}`} 
                                className="gallery-image" 
                                key={images[currentImageIndex].id || currentImageIndex}
                            />
                            {images.length > 1 && (
                                <div className="gallery-controls">
                                    <button className="secondary-button gallery-prev" type="button" onClick={() => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)}>‹</button>
                                    <button className="secondary-button gallery-next" type="button" onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}>›</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="gallery-placeholder">Cargando imágenes...</div>
                    )}
                </div>
            </div>

            <div className="auth-form-column">
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
        </div>
    );
};

export default LoginRegister;