import React from 'react';
import { useFlash } from '../context/useFlash.js';

// Componente modular que renderiza el modal de usuarios del tablero.
// Contiene: listado de miembros, avatar, invitación por email y cambio de rol.
// Extraído de `BoardEditor.jsx` para mantener responsabilidades claras.
const BoardUsersModal = ({
  visible,
  members,
  normalizeMemberImage,
  defaultMemberProfile,
  inviteEmail,
  setInviteEmail,
  inviteLoading,
  onInvite,
  editingRoleMemberId,
  editingRoleValue,
  setEditingRoleMemberId,
  setEditingRoleValue,
  updateMemberRole,
  currentUserRole,
  close,
}) => {
  const { show } = useFlash();
  if (!visible) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-title">Usuarios autorizados</div>
        <div className="main-card modal-main-card">
          <div className="mb-8">
            <input
              type="email"
              placeholder="Correo a invitar"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="invite-input"
            />
            <button
              className="main-button main-button--small"
              disabled={inviteLoading || !inviteEmail}
              onClick={onInvite}
            >Invitar</button>
          </div>

          <ul className="members-list">
            {members.map((m) => (
              <li key={m.id}>
                <div className="member-row">
                  <div className="member-avatar-box">
                    <img src={normalizeMemberImage(m.user_profilepicture || m.profilepicture || m.avatar || '')} alt="avatar" onError={(e) => { e.currentTarget.src = defaultMemberProfile; }} />
                  </div>
                  <div className="member-info">
                    <div className="member-name">{m.user_name || m.user}</div>
                    <div className="member-email">{m.user_email || m.user}</div>
                  </div>
                  <div className="member-role-wrapper">
                    {editingRoleMemberId === m.id ? (
                      <select value={editingRoleValue} onChange={async (e) => {
                        const newRole = e.target.value;
                        if (newRole === 'owner' && currentUserRole !== 'owner') {
                          show('No tienes permiso para asignar owner', 'error');
                          return;
                        }
                        try {
                          await updateMemberRole(m.id, newRole);
                          setEditingRoleMemberId(null);
                          setEditingRoleValue(null);
                        } catch (err) {
                          show(err.message || 'No se pudo cambiar el rol', 'error');
                        }
                      }} onBlur={() => { setEditingRoleMemberId(null); setEditingRoleValue(null); }}>
                        <option value="viewer">Visitante</option>
                        <option value="editor">Editor</option>
                        {currentUserRole === 'owner' ? <option value="owner">Propietario</option> : null}
                      </select>
                    ) : (
                      <div className={`member-role-tag ${(currentUserRole === 'owner' || (currentUserRole === 'editor' && m.role === 'viewer')) ? 'member-role-clickable' : ''}`} onDoubleClick={() => {
                        if (currentUserRole === 'owner' || (currentUserRole === 'editor' && m.role === 'viewer')) {
                          setEditingRoleMemberId(m.id);
                          setEditingRoleValue(m.role);
                        }
                      }}>{m.role === 'owner' ? 'Propietario' : m.role === 'editor' ? 'Editor' : 'Visitante'}</div>
                    )}

                    <div className="members-actions">
                      {!((m.role === 'owner')) && currentUserRole && (currentUserRole === 'owner' || (currentUserRole === 'editor' && m.role === 'viewer')) ? (
                        <button className="icon-button" title="Cambiar rol" onClick={() => { setEditingRoleMemberId(m.id); setEditingRoleValue(m.role); }}>
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21l3-1 11-11 2 2L8 22l-5 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      ) : null}
                      {currentUserRole === 'owner' && m.role !== 'owner' ? (
                        <button className="icon-button icon-button--danger" title="Eliminar" onClick={async () => {
                          if (!window.confirm(`¿Eliminar el acceso de ${m.user_name || m.user}?`)) return;
                          try {
                            await updateMemberRole(m.id, 'viewer');
                          } catch (err) { show(err.message || 'Error', 'error'); }
                        }}>
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" onClick={close}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default BoardUsersModal;
