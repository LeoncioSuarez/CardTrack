import React from 'react';
import { useAuth } from '../useAuth.js';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { user, token, refreshUser } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        // If we have a token, allow retrying the profile fetch; otherwise prompt to login
        if (token) {
            return (
                <div className="profile-container" style={{ color: 'var(--color-primary-text)' }}>
                    <h1 className="profile-title">Mi Perfil</h1>
                    <div className="main-card profile-info-box">
                        <p className="loading-message">Cargando perfil... Si tarda mucho, pulsa "Reintentar".</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="main-button main-button--small" onClick={() => refreshUser(token)}>Reintentar</button>
                            <button className="secondary-button" onClick={() => navigate('/')}>Ir a inicio</button>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="profile-container" style={{ color: 'var(--color-primary-text)' }}>
                <h1 className="profile-title">Mi Perfil</h1>
                <div className="main-card profile-info-box">
                    <p className="error-message">No estás autenticado. Inicia sesión para ver tu perfil.</p>
                    <div style={{ marginTop: 12 }}>
                        <button className="main-button" onClick={() => navigate('/')}>Ir a iniciar sesión</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <h1 className="profile-title">Mi Perfil</h1>
            <div className="main-card profile-info-box">
                <div className="profile-info-row">
                    <span className="profile-label">Nombre de Usuario:</span>
                    <span className="profile-value">{user.name}</span>
                </div>
                <div className="profile-info-row">
                    <span className="profile-label">Correo Registrado:</span>
                    <span className="profile-value">{user.email}</span>
                </div>
                <div className="profile-info-row">
                    <span className="profile-label">Fecha de Registro:</span>
                    <span className="profile-value">{user.registration_date ? new Date(user.registration_date).toLocaleString() : (user.registrationDate ? new Date(user.registrationDate).toLocaleString() : 'No disponible')}</span>
                </div>
                <div className="profile-info-row">
                    <span className="profile-label">Último Inicio de Sesión:</span>
                    <span className="profile-value">{user.last_login ? new Date(user.last_login).toLocaleString() : (user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'No disponible')}</span>
                </div>
            </div>
        </div>
    );
};

export default Profile;