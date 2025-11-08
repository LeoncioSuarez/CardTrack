import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../useAuth.js';
import Avatar from './Avatar';

const RAW_BASE = import.meta?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const API_BASE = RAW_BASE.replace(/\/$/, '');

const fetchJson = async (url, opts = {}) => {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || JSON.stringify(data));
  return data;
};

const Development = () => {
  const { token } = useAuth() || {};
  const [tab, setTab] = useState('releases');

  // Releases state
  const [releases, setReleases] = useState([]);
  const [carousel, setCarousel] = useState([]);
  const [users, setUsers] = useState([]);

  // UI/UX state for inline edits / confirmations
  const [creatingRelease, setCreatingRelease] = useState(false);
  const [newReleaseTitle, setNewReleaseTitle] = useState('');
  const [newReleaseDesc, setNewReleaseDesc] = useState('');
  const [editingReleaseId, setEditingReleaseId] = useState(null);
  const [editingReleaseValues, setEditingReleaseValues] = useState({ release_title: '', release_description: '' });
  const [deletingReleaseId, setDeletingReleaseId] = useState(null);
  const [deletingCarouselId, setDeletingCarouselId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserValues, setEditingUserValues] = useState({ name: '', email: '', password: '' });
  const [editingUserFile, setEditingUserFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const authHeaders = () => ({ Authorization: `Token ${token}` });

  const loadAll = async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        fetchJson(`${API_BASE}/releases/`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } }),
        fetchJson(`${API_BASE}/carousel-images/`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } }),
        fetchJson(`${API_BASE}/users/`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } }),
      ]);
      setReleases(r1 || []);
      setCarousel(r2 || []);
      setUsers(r3 || []);
    } catch (e) {
      console.error('loadAll', e);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, []);

  // simple dropdown menu component used for item actions
  const DropdownMenu = ({ children, options = [] }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const onDoc = (e) => {
        if (!ref.current) return;
        if (!ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener('click', onDoc);
      return () => document.removeEventListener('click', onDoc);
    }, []);

    return (
      <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
        <button className="dev-menu-button secondary-button" type="button" onClick={() => setOpen(s => !s)}>⋯</button>
        {open && (
          <div className="dev-dropdown">
            {options.map((opt, idx) => (
              <button key={idx} type="button" onClick={() => { setOpen(false); opt.onClick(); }} className="ghost-button">{opt.label}</button>
            ))}
            {children}
          </div>
        )}
      </div>
    );
  };

  /* Releases CRUD */
  const createRelease = async (payload) => {
    await fetchJson(`${API_BASE}/releases/`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload) });
    await loadAll();
  };
  const updateRelease = async (id, payload) => {
    await fetchJson(`${API_BASE}/releases/${id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload) });
    await loadAll();
  };
  const deleteRelease = async (id) => {
    await fetch(`${API_BASE}/releases/${id}/`, { method: 'DELETE', headers: { ...authHeaders() } });
    await loadAll();
  };

  /* Carousel CRUD (supports file upload) */
  const createCarousel = async (file, title = '') => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('title', title);
    const res = await fetch(`${API_BASE}/carousel-images/`, { method: 'POST', headers: { Authorization: `Token ${token}` }, body: fd });
    if (!res.ok) throw new Error('Failed');
    await loadAll();
  };
  const deleteCarousel = async (id) => {
    await fetch(`${API_BASE}/carousel-images/${id}/`, { method: 'DELETE', headers: { ...authHeaders() } });
    await loadAll();
  };

  /* Users: simple list, allow changing profilepicture via PATCH */
  const updateUser = async (id, { name, email, password, file }) => {
    const fd = new FormData();
    if (name) fd.append('name', name);
    if (email) fd.append('email', email);
    if (password) fd.append('password', password);
    if (file) fd.append('profilepicture', file);
    const res = await fetch(`${API_BASE}/users/${id}/`, { method: 'PATCH', headers: { Authorization: `Token ${token}` }, body: fd });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || 'Failed to update user');
    }
    await loadAll();
  };
  const deleteUser = async (id) => {
    await fetch(`${API_BASE}/users/${id}/`, { method: 'DELETE', headers: { ...authHeaders() } });
    await loadAll();
  };

  return (
    <div className="development-panel main-card">
      <h2>Development panel</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className={`secondary-button ${tab === 'releases' ? 'active' : ''}`} onClick={() => setTab('releases')}>Releases</button>
        <button className={`secondary-button ${tab === 'carousel' ? 'active' : ''}`} onClick={() => setTab('carousel')}>Carousel</button>
        <button className={`secondary-button ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>Users</button>
      </div>

      {tab === 'releases' && (
        <div>
          <h3>Releases</h3>
          <div className="dev-list">
            {releases.map(r => (
              <div key={r.id} className="dev-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{r.release_title}</div>
                  <div style={{ color: 'var(--color-secondary-text)' }}>{r.release_description}</div>
                </div>
                <div style={{ flex: '0 0 auto', marginLeft: 12 }}>
                  <DropdownMenu options={[
                    { label: 'Editar', onClick: () => { setEditingReleaseId(r.id); setEditingReleaseValues({ release_title: r.release_title, release_description: r.release_description }); } },
                    { label: 'Borrar', onClick: () => { setDeletingReleaseId(r.id); } },
                  ]} />
                </div>

                {editingReleaseId === r.id && (
                  <div className="dev-inline-form">
                    <input className="form-input" value={editingReleaseValues.release_title} onChange={(e) => setEditingReleaseValues(v => ({ ...v, release_title: e.target.value }))} />
                    <input className="form-input" value={editingReleaseValues.release_description} onChange={(e) => setEditingReleaseValues(v => ({ ...v, release_description: e.target.value }))} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="main-button main-button--small" onClick={async () => { await updateRelease(r.id, editingReleaseValues); setEditingReleaseId(null); }}>Guardar</button>
                      <button className="secondary-button main-button--small" onClick={() => setEditingReleaseId(null)}>Cancelar</button>
                    </div>
                  </div>
                )}

                {deletingReleaseId === r.id && (
                  <div className="inline-confirm">
                    <span>¿Borrar release?</span>
                    <button className="danger-button main-button--small" onClick={async () => { await deleteRelease(r.id); setDeletingReleaseId(null); }}>Sí</button>
                    <button className="secondary-button main-button--small" onClick={() => setDeletingReleaseId(null)}>No</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            {!creatingRelease ? (
              <button className="main-button" onClick={() => setCreatingRelease(true)}>Crear release</button>
            ) : (
              <div className="dev-inline-form" style={{ marginTop: 8 }}>
                <input className="form-input" placeholder="Título" value={newReleaseTitle} onChange={(e) => setNewReleaseTitle(e.target.value)} />
                <input className="form-input" placeholder="Descripción" value={newReleaseDesc} onChange={(e) => setNewReleaseDesc(e.target.value)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="main-button main-button--small" onClick={async () => { if (!newReleaseTitle) return; await createRelease({ release_title: newReleaseTitle, release_description: newReleaseDesc }); setNewReleaseTitle(''); setNewReleaseDesc(''); setCreatingRelease(false); }}>Guardar</button>
                  <button className="secondary-button main-button--small" onClick={() => { setCreatingRelease(false); setNewReleaseTitle(''); setNewReleaseDesc(''); }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'carousel' && (
        <div>
          <h3>Carousel images</h3>
          <div className="dev-list">
            {carousel.map(c => (
              <div key={c.id} className="dev-item">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img src={c.image} alt={c.title} style={{ maxWidth: 200, display: 'block' }} />
                  <div>{c.title}</div>
                </div>
                <div>
                  <DropdownMenu options={[{ label: 'Borrar', onClick: () => setDeletingCarouselId(c.id) }]} />
                </div>

                {deletingCarouselId === c.id && (
                  <div className="inline-confirm">
                    <span>¿Borrar imagen?</span>
                    <button className="danger-button main-button--small" onClick={async () => { await deleteCarousel(c.id); setDeletingCarouselId(null); }}>Sí</button>
                    <button className="secondary-button main-button--small" onClick={() => setDeletingCarouselId(null)}>No</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <input type="file" id="dev-carousel-file" />
            <input type="text" id="dev-carousel-title" placeholder="Title" />
            <button className="main-button" onClick={async () => {
              const f = document.getElementById('dev-carousel-file').files[0];
              const t = document.getElementById('dev-carousel-title').value || '';
              if (!f) { setUploadError('Seleccione un archivo'); return; }
              try { setUploadError(null); await createCarousel(f, t); document.getElementById('dev-carousel-file').value = ''; document.getElementById('dev-carousel-title').value = ''; } catch { setUploadError('Error al subir'); }
            }}>Subir imagen</button>
            {uploadError && <div className="error-message" style={{ marginTop: 8 }}>{uploadError}</div>}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div>
          <h3>Users</h3>
          <div className="dev-list">
            {users.map(u => (
              <div key={u.id} className="dev-item">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                  <Avatar src={u.profilepicture || ''} alt={u.name} size={48} />
                  <div>
                    <div><strong>{u.name}</strong></div>
                    <div style={{ color: 'var(--color-secondary-text)' }}>{u.email}</div>
                  </div>
                </div>

                <div style={{ flex: '0 0 auto' }}>
                  <DropdownMenu options={[{ label: 'Editar', onClick: () => { setEditingUserId(u.id); setEditingUserValues({ name: u.name || '', email: u.email || '', password: '' }); } }, { label: 'Borrar', onClick: () => setDeletingUserId(u.id) }]} />
                </div>

                <div style={{ display: 'none' }}>
                  <input type="file" id={`user-pic-${u.id}`} onChange={async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; try { await updateUser(u.id, { file: f }); await loadAll(); } catch { /* ignore */ } }} />
                </div>

                {deletingUserId === u.id && (
                  <div className="inline-confirm">
                    <span>¿Borrar usuario?</span>
                    <button className="danger-button main-button--small" onClick={async () => { await deleteUser(u.id); setDeletingUserId(null); }}>Sí</button>
                    <button className="secondary-button main-button--small" onClick={() => setDeletingUserId(null)}>No</button>
                  </div>
                )}
                  {editingUserId === u.id && (
                    <div className="dev-inline-form">
                      <input className="form-input" placeholder="Nombre" value={editingUserValues.name} onChange={(e) => setEditingUserValues(v => ({ ...v, name: e.target.value }))} />
                      <input className="form-input" placeholder="Correo" value={editingUserValues.email} onChange={(e) => setEditingUserValues(v => ({ ...v, email: e.target.value }))} />
                      <input className="form-input" type="password" placeholder="Nueva contraseña (opcional)" value={editingUserValues.password} onChange={(e) => setEditingUserValues(v => ({ ...v, password: e.target.value }))} />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="file" id={`edit-user-file-${u.id}`} onChange={(e) => setEditingUserFile(e.target.files && e.target.files[0])} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="main-button main-button--small" onClick={async () => {
                            try {
                              await updateUser(u.id, { name: editingUserValues.name, email: editingUserValues.email, password: editingUserValues.password, file: editingUserFile });
                              setEditingUserId(null); setEditingUserFile(null);
                            } catch (err) { console.error(err); alert('Error al actualizar usuario'); }
                          }}>Guardar</button>
                          <button className="secondary-button main-button--small" onClick={() => { setEditingUserId(null); setEditingUserFile(null); }}>Cancelar</button>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Development;
