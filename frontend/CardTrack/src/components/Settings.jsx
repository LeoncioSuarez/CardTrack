import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import * as authApi from '../utils/authApi';

export const Settings = () => {
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

    const { user, token, refreshUser } = useContext(AuthContext);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwError, setPwError] = useState(null);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwSuccess, setPwSuccess] = useState(null);

    const openPasswordModal = () => {
        setPwError(null);
        setPwSuccess(null);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordModal(true);
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
    };

    const submitChangePassword = async () => {
        setPwError(null);
        setPwSuccess(null);
        if (!currentPassword || !newPassword) {
            setPwError('Ambos campos son requeridos.');
            return;
        }
        if (newPassword.length < 8) {
            setPwError('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwError('La confirmación no coincide.');
            return;
        }
        if (!user || !user.id || !token) {
            setPwError('No estás autenticado.');
            return;
        }
        setPwLoading(true);
        try {
            const res = await authApi.changePassword(token, user.id, currentPassword, newPassword);
            setPwSuccess(res.message || 'Contraseña actualizada');
            // optional: refresh user (not strictly necessary)
            try { await refreshUser(); } catch (_) {}
            // close after short delay
            setTimeout(() => {
                setPwLoading(false);
                setShowPasswordModal(false);
            }, 900);
        } catch (err) {
            setPwLoading(false);
            setPwError(err.message || 'Error al cambiar la contraseña');
        }
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
                        className={`toggle-base ${isDarkMode ? 'active' : ''}`}
                        onClick={handleToggleDarkMode}
                    >
                        <div className="toggle-circle"></div>
                    </div>
                </div>
            </div>
            <div className="main-card settings-section">
                <h2 className="settings-section-title">Seguridad de la Cuenta</h2>
                <hr />
                <div className="setting-row">
                    <span>Cambiar Contraseña</span>
                    <button className="warning-button" onClick={openPasswordModal}>
                        Cambiar
                    </button>
                </div>
                {showPasswordModal && (
                    <div className="modal-overlay" role="dialog" aria-modal="true">
                        <div className="modal-content">
                            <div className="modal-title">Cambiar contraseña</div>
                            <div className="form-row">
                                <label>Contraseña actual</label>
                                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="form-input" />
                            </div>
                            <div className="form-row">
                                <label>Nueva contraseña</label>
                                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" />
                            </div>
                            <div className="form-row">
                                <label>Confirmar nueva</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" />
                            </div>
                            {pwError && <div className="error-message">{pwError}</div>}
                            {pwSuccess && <div className="modal-alert">{pwSuccess}</div>}
                            <div className="modal-actions">
                                <button className="secondary-button" onClick={closePasswordModal} disabled={pwLoading}>Cancelar</button>
                                <button className="main-button" onClick={submitChangePassword} disabled={pwLoading}>{pwLoading ? 'Guardando...' : 'Guardar'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;