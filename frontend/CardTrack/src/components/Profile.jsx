import React, { useState, useRef } from 'react';
import { useAuth } from '../useAuth.js';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const DEV_LOG_FORMDATA = window && window.__DEV_LOG_FORMDATA === true;

const Profile = () => {
    const { user, token, refreshUser } = useAuth();

    // hooks must be at top level
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user ? user.name : '');
    const MAX_ABOUT = 255;
    const [aboutme, setAboutme] = useState(user ? user.aboutme || '' : '');
    const [aboutCharsLeft, setAboutCharsLeft] = useState(MAX_ABOUT - (user && user.aboutme ? user.aboutme.length : 0));
    const [errorMsg, setErrorMsg] = useState(null);
    const backendBase = API_BASE_URL.replace(/\/api\/?$/, '');
    const mediaBase = backendBase + '/media/';
    const defaultProfile = mediaBase + 'profilepic/default.jpg';

    const normalizeImage = (img) => {
        if (!img) return defaultProfile;
        if (typeof img !== 'string') return defaultProfile;
        if (img.startsWith('http://') || img.startsWith('https://')) return img;
        // remove leading slash if present
        return mediaBase + img.replace(/^\/+/, '');
    };

    const [previewSrc, setPreviewSrc] = useState(user ? normalizeImage(user.profilepicture) : defaultProfile);
    const [fileToUpload, setFileToUpload] = useState(null);
    const inputFileRef = useRef(null);
    const [saving, setSaving] = useState(false);

    if (!user) {
        return <div className="profile-container" style={{ color: 'var(--color-primary-text)' }}>Cargando perfil...</div>;
    }
    
    const enterEdit = () => {
        setName(user.name || '');
        setAboutme(user.aboutme || '');
        setPreviewSrc(normalizeImage(user.profilepicture));
        setEditing(true);
    };
    
    const cancelEdit = () => {
        setEditing(false);
        setFileToUpload(null);
        setPreviewSrc(normalizeImage(user.profilepicture));
    };
    
        const onPhotoClick = () => {
            if (!editing) return;
            inputFileRef.current?.click();
        };
    
        const onFileChange = (e) => {
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewSrc(reader.result);
            };
            reader.readAsDataURL(f);
            setFileToUpload(f);
        };
    
        const saveChanges = async () => {
            setSaving(true);
            try {
                const fd = new FormData();
                fd.append('name', name);
                fd.append('aboutme', aboutme);
                // Prefer the actual input's file in case state wasn't updated
                const inputFile = inputFileRef.current && inputFileRef.current.files && inputFileRef.current.files[0];
                const file = inputFile || fileToUpload;
                if (file) {
                    fd.append('profilepicture', file);
                    // also append alternate key for compatibility
                    try { fd.append('profile_picture', file); } catch (err) { console.debug('append alt key failed', err); }
                }
                if (DEV_LOG_FORMDATA && file) console.debug('Uploading file:', file.name, file.size, file.type);
                if (DEV_LOG_FORMDATA) {
                    try {
                        for (const pair of fd.entries()) {
                            console.debug('FormData entry:', pair[0], pair[1]);
                        }
                    } catch (err) { console.debug('formdata debug failed', err); }
                }
                    // For compatibility: if a file exists, add it under alternate key as well
                    if (fileToUpload) {
                        try { fd.append('profile_picture', fileToUpload); } catch (err) { console.debug('append alt key failed', err); }
                    }
                    const response = await fetch(`${API_BASE_URL}/users/${user.id}/`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Token ${token}`
                    },
                    body: fd
                });
                if (!response.ok) {
                    const err = await response.json();
                    console.error('Failed to save profile', err);
                    if (err && typeof err === 'object') {
                        const parts = [];
                        for (const [k, v] of Object.entries(err)) {
                            if (Array.isArray(v)) parts.push(`${k}: ${v.join(' ')}`);
                            else parts.push(`${k}: ${v}`);
                        }
                        setErrorMsg(parts.join(' | '));
                    } else {
                        setErrorMsg('No se pudo guardar el perfil.');
                    }
                } else {
                    await refreshUser();
                    setEditing(false);
                    setFileToUpload(null);
                    setErrorMsg(null);
                }
            } catch (err) {
                console.error(err);
                setErrorMsg('Error al guardar. Revisa la consola.');
            } finally {
                setSaving(false);
            }
        };
    
        return (
            <div className="profile-container">
                <h1 className="profile-title">Mi Perfil</h1>
                <div className="main-card profile-info-box" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', padding: 24, maxWidth: 1000 }}>
                    <div style={{ width: 260, textAlign: 'center', flexShrink: 0 }}>
                        <div
                            onClick={onPhotoClick}
                            style={{
                                width: 220,
                                height: 220,
                                margin: '0 auto',
                                borderRadius: 8,
                                overflow: 'hidden',
                                background: '#f7f7f7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: editing ? 'pointer' : 'default',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                            }}
                        >
                            {previewSrc ? (
                                <img src={previewSrc} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ color: '#999' }}>Sin foto</div>
                            )}
                        </div>
                        <input ref={inputFileRef} name="profilepicture" type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
                        <div style={{ marginTop: 14, fontWeight: 700, fontSize: 18 }}>{user.name || 'Sin nombre'}</div>
                        <div style={{ marginTop: 6, color: '#666' }}>{user.email}</div>
                    </div>

                    <div style={{ flex: 1 }}>
                        {!editing ? (
                            <div>
                                <div style={{ marginBottom: 8 }}><strong>About me</strong></div>
                                <div style={{ whiteSpace: 'pre-wrap', marginBottom: 18, minHeight: 80 }}>{user.aboutme || 'No hay descripción.'}</div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                    <div style={{ background: '#fafafa', padding: 12, borderRadius: 6 }}>
                                        <div style={{ fontSize: 12, color: '#666' }}>Registrado</div>
                                        <div style={{ fontWeight: 600 }}>{user.registration_date ? new Date(user.registration_date).toLocaleString() : 'No disponible'}</div>
                                    </div>
                                    <div style={{ background: '#fafafa', padding: 12, borderRadius: 6 }}>
                                        <div style={{ fontSize: 12, color: '#666' }}>Último login</div>
                                        <div style={{ fontWeight: 600 }}>{user.last_login ? new Date(user.last_login).toLocaleString() : 'No disponible'}</div>
                                    </div>
                                </div>

                                <div>
                                    <button className="btn" onClick={enterEdit}>Editar perfil</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {errorMsg && (
                                    <div style={{ marginBottom: 12, color: 'red' }}>{errorMsg}</div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 6 }}>Nombre</label>
                                        <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: 6 }}>About me</label>
                                                <textarea value={aboutme} onChange={e => {
                                                    const v = e.target.value;
                                                    if (v.length <= MAX_ABOUT) {
                                                        setAboutme(v);
                                                        setAboutCharsLeft(MAX_ABOUT - v.length);
                                                    } else {
                                                        setAboutme(v.slice(0, MAX_ABOUT));
                                                        setAboutCharsLeft(0);
                                                    }
                                                }} rows={6} style={{ width: '100%' }} />
                                                <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{aboutCharsLeft} caracteres restantes</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn" onClick={saveChanges} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
                                    <button className="btn btn-secondary" onClick={cancelEdit} disabled={saving}>Cancelar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
};

export default Profile;