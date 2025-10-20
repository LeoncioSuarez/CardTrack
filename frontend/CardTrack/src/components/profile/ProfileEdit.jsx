import React from 'react';

export const ProfileEdit = ({ name, setName, aboutme, setAboutme, aboutCharsLeft, MAX_ABOUT, saveChanges, cancelEdit, saving }) => {
  return (
    <div>
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
              } else {
                  setAboutme(v.slice(0, MAX_ABOUT));
              }
          }} rows={6} style={{ width: '100%' }} />
          <div style={{ fontSize: 12, color: 'var(--color-secondary-text)', marginTop: 6 }}>{aboutCharsLeft} caracteres restantes</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={saveChanges} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        <button className="btn btn-secondary" onClick={cancelEdit} disabled={saving}>Cancelar</button>
      </div>
    </div>
  );
};

export default ProfileEdit;
