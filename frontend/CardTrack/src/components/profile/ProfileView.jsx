import React from 'react';

// side: 'left' | 'right' | 'both'
export const ProfileView = ({ user, previewSrc, onPhotoClick, enterEdit, side = 'both', defaultProfile }) => {
  const Left = (
    <div className="profile-left">
      <div onClick={onPhotoClick} className="profile-photo-box">
        {previewSrc ? (
          <img src={previewSrc} alt="profile" onError={(e) => { if (defaultProfile) e.currentTarget.src = defaultProfile; }} />
        ) : (
          <div className="muted">Sin foto</div>
        )}
      </div>
      <div className="profile-name">{user.name || 'Sin nombre'}</div>
      <div className="profile-email">{user.email}</div>
    </div>
  );

  const Right = (
    <div className="profile-right">
      <div className="mb-8"><strong>About me</strong></div>
      <div className="about-paragraph">{user.aboutme || 'No hay descripción.'}</div>

      <div className="profile-info-grid">
        <div className="info-card">
          <div className="label">Registrado</div>
          <div className="value">{user.registration_date ? new Date(user.registration_date).toLocaleString() : 'No disponible'}</div>
        </div>
        <div className="info-card">
          <div className="label">Último login</div>
          <div className="value">{user.last_login ? new Date(user.last_login).toLocaleString() : 'No disponible'}</div>
        </div>
      </div>

      <div>
        <button className="secondary-button" onClick={enterEdit}>Editar perfil</button>
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
