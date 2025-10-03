import React from 'react';
import { useAuth } from '../useAuth.js';

const Profile = () => {
    const { user } = useAuth();


    if (!user) {
        return <div className="profile-container" style={{ color: 'var(--color-primary-text)' }}>Cargando perfil...</div>;
    }

    return (
        <div className="profile-container">
            <h1 className="profile-title">Mi Perfil</h1>

            {/* Usamos la clase general de card y la específica de profile */}
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
                    <span className="profile-value">{user.registrationDate}</span>
                </div>
                
                <div className="profile-info-row"> 
                    <span className="profile-label">Último Inicio de Sesión:</span>
                    <span className="profile-value">{user.lastLogin}</span>
                </div>
            </div>
        </div>
    );
};

export default Profile;