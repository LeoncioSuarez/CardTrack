import React from 'react';

// side: 'left' | 'right' | 'both'
export const ProfileView = ({ user, previewSrc, onPhotoClick, enterEdit, side = 'both' }) => {
  const Left = (
    <div style={{ width: 260, textAlign: 'center', flexShrink: 0 }}>
      <div
        onClick={onPhotoClick}
        style={{
          width: 220,
          height: 220,
          margin: '0 auto',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--color-input-background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'default',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
        }}
      >
        {previewSrc ? (
          <img src={previewSrc} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ color: '#999' }}>Sin foto</div>
        )}
      </div>
      <div style={{ marginTop: 14, fontWeight: 700, fontSize: 18, color: 'var(--color-primary-text)' }}>{user.name || 'Sin nombre'}</div>
      <div style={{ marginTop: 6, color: 'var(--color-secondary-text)' }}>{user.email}</div>
    </div>
  );

  const Right = (
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: 8 }}><strong>About me</strong></div>
      <div style={{ whiteSpace: 'pre-wrap', marginBottom: 18, minHeight: 80 }}>{user.aboutme || 'No hay descripción.'}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'var(--color-card-background)', padding: 12, borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--color-secondary-text)' }}>Registrado</div>
          <div style={{ fontWeight: 600, color: 'var(--color-primary-text)' }}>{user.registration_date ? new Date(user.registration_date).toLocaleString() : 'No disponible'}</div>
        </div>
        <div style={{ background: 'var(--color-card-background)', padding: 12, borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--color-secondary-text)' }}>Último login</div>
          <div style={{ fontWeight: 600, color: 'var(--color-primary-text)' }}>{user.last_login ? new Date(user.last_login).toLocaleString() : 'No disponible'}</div>
        </div>
      </div>

      <div>
        <button className="btn" onClick={enterEdit}>Editar perfil</button>
      </div>
    </div>
  );

  if (side === 'left') return Left;
  if (side === 'right') return Right;
  return (
    <div>
      {Left}
      {Right}
    </div>
  );
};

export default ProfileView;
