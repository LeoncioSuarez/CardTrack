// src/components/LoginRegister.jsx (Actualizado para diseño de dos columnas)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../useAuth.js';
import { useNavigate } from 'react-router-dom'; // Aseguramos el import

const API_GALLERY_URL = 'http://127.0.0.1:8000/api/carousel-images/';

const LoginRegister = () => {
    const { login, register, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    // Estados del formulario
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Estados de la Galería
    const [images, setImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // 1. Redirección si ya está autenticado
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // 2. Cargar Imágenes de la Galería
    useEffect(() => {
        const fetchImages = async () => {
            try {
                // Asegúrate de que este endpoint sea público y no requiera autenticación
                const response = await fetch(API_GALLERY_URL);
                if (response.ok) {
                    let data = await response.json();
                    // Filtrar solo las activas y ordenar por position
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

    // 3. Lógica del Carrusel (Cambio automático cada 5 segundos)
    useEffect(() => {
        if (images.length > 0) {
            const interval = setInterval(() => {
                setCurrentImageIndex(prevIndex => (prevIndex + 1) % images.length);
            }, 5000); // Cambia cada 5 segundos

            return () => clearInterval(interval); // Limpieza
        }
    }, [images.length]);

    // 4. Manejo del Formulario
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
            // Si tiene éxito, el useEffect de arriba redirige
        } catch (error) {
            console.error('Error en login/register:', error);
            setError('Error de comunicación con el servidor. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    // 5. Renderizado
    const currentImageUrl = images.length > 0 
        ? (images[currentImageIndex].image_url || images[currentImageIndex].image || images[currentImageIndex].url) // Ajusta el campo según tu respuesta de API
        : null;

    return (
        <div className="auth-page-container">
            
            {/* Columna Izquierda: Presentación y Carrusel */}
            <div className="auth-presentation-column">
                <h1 className="presentation-title-1">Bienvenido A CardTrack</h1>
                <h2 className="presentation-title-2">Tu Editor Kanban De Confianza</h2>

                {/* Contenedor del Carrusel */}
                <div className="gallery-container" onMouseEnter={() => { /* pausa al hacer hover */ }}>
                    {currentImageUrl ? (
                        <>
                            <img 
                                src={currentImageUrl} 
                                alt={images[currentImageIndex].alt_text || `Slide ${currentImageIndex + 1}`} 
                                className="gallery-image" 
                                key={images[currentImageIndex].id || currentImageIndex}
                            />
                            {/* Controles simples */}
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

            {/* Columna Derecha: Formulario de Login/Registro */}
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