import React, { useState, useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { updateUser as updateUserApi } from '../utils/profileApi';
import ProfileView from './profile/ProfileView.jsx';
import ProfileEdit from './profile/ProfileEdit.jsx';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const DEV_LOG_FORMDATA = window && window.__DEV_LOG_FORMDATA === true;

export const Profile = () => {
    const { user, token, refreshUser } = useContext(AuthContext);

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
        // if server already returned a path containing 'media/', avoid duplicating
        const cleaned = img.replace(/^\/+/, '');
        if (cleaned.startsWith('media/')) return backendBase + '/' + cleaned;
        return mediaBase + cleaned;
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
                    // append only once to avoid duplicate uploads
                    fd.append('profilepicture', file);
                }
                if (DEV_LOG_FORMDATA && file) console.debug('Uploading file:', file.name, file.size, file.type);
                if (DEV_LOG_FORMDATA) {
                    try {
                        for (const pair of fd.entries()) {
                            console.debug('FormData entry:', pair[0], pair[1]);
                        }
                    } catch (err) { console.debug('formdata debug failed', err); }
                }
                    // Note: we intentionally append the file only once (key 'profilepicture') to avoid duplicate files on the server.
                    try {
                        await updateUserApi(user.id, token, fd);
                        // success
                        await refreshUser();
                        setEditing(false);
                        setFileToUpload(null);
                        setErrorMsg(null);
                    } catch (err) {
                        console.error('Failed to save profile', err);
                        const msg = (err && err.message) ? err.message : 'No se pudo guardar el perfil.';
                        setErrorMsg(msg);
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
                    <input ref={inputFileRef} name="profilepicture" type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
                    <ProfileView user={user} previewSrc={previewSrc} onPhotoClick={onPhotoClick} enterEdit={enterEdit} side="left" />
                </div>

                <div style={{ flex: 1 }}>
                    {!editing ? (
                        <ProfileView user={user} previewSrc={previewSrc} onPhotoClick={onPhotoClick} enterEdit={enterEdit} side="right" />
                    ) : (
                        <div>
                            {errorMsg && (
                                <div style={{ marginBottom: 12, color: 'red' }}>{errorMsg}</div>
                            )}
                            <ProfileEdit
                                name={name}
                                setName={setName}
                                aboutme={aboutme}
                                setAboutme={(v) => { setAboutme(v); setAboutCharsLeft(MAX_ABOUT - (v ? v.length : 0)); }}
                                aboutCharsLeft={aboutCharsLeft}
                                MAX_ABOUT={MAX_ABOUT}
                                saveChanges={saveChanges}
                                cancelEdit={cancelEdit}
                                saving={saving}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;