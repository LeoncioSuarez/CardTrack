import React from 'react';

const ProfileEdit = ({ name, setName, aboutme, setAboutme, aboutCharsLeft, MAX_ABOUT, saveChanges, cancelEdit, saving }) => {
  const onChangeAbout = (e) => {
    const v = e.target.value || '';
    // enforce MAX_ABOUT
    setAboutme(v.slice(0, MAX_ABOUT));
  };

  return (
    <div>
      <div className="grid-1">
        <label className="label-block">Nombre</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full" />
      </div>

      <div className="grid-1">
        <label className="label-block">About me</label>
        <textarea value={aboutme} onChange={onChangeAbout} rows={6} className="w-full" />
        <div className="text-small muted">{aboutCharsLeft} caracteres restantes</div>
      </div>

      <div className="flex-gap-8">
        <button className="secondary-button" onClick={cancelEdit} disabled={saving}>Cancelar</button>
        <button className="main-button" onClick={saveChanges} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div>
  );
};

export default ProfileEdit;
