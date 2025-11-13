import React, { useState, useEffect } from 'react';
import { useFlash } from '../context/useFlash.js';

const Settings = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('cardtrack-darkmode') === 'true';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('theme-dark');
        } else {
            root.classList.remove('theme-dark');
        }
    }, [isDarkMode]);

    const handleToggleDarkMode = () => {
        setIsDarkMode((prev) => {
            const next = !prev;
            localStorage.setItem('cardtrack-darkmode', next);
            return next;
        });
    };

    const { show } = useFlash();
    const handlePasswordChange = () => {
        show('Se ha enviado un enlace para cambiar la contraseña a tu correo. (Simulado)', 'info');
    };

    return (
        <div className="settings-container">
            <h1 className="settings-title">Opciones y Seguridad</h1>
            <div className="main-card settings-section">
                <h2 className="settings-section-title">Opciones de Interfaz</h2>
                <hr />
                <div className="setting-row">
                    <span>Modo Oscuro</span>
                    <div
                        className="toggle-base"
                        onClick={handleToggleDarkMode}
                        style={{
                            backgroundColor: isDarkMode ? 'var(--color-accent-primary)' : 'var(--color-secondary-text)',
                        }}
                    >
                        <div
                            className="toggle-circle"
                            style={{
                                left: isDarkMode ? '22px' : '2px',
                            }}
                        ></div>
                    </div>
                </div>
            </div>
            <div className="main-card settings-section">
                <h2 className="settings-section-title">Seguridad de la Cuenta</h2>
                <hr />
                <div className="setting-row">
                    <span>Cambiar Contraseña</span>
                    <button className="warning-button" onClick={handlePasswordChange}>
                        Cambiar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;