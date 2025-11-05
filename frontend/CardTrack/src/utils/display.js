export function getDisplayName(entity) {
  // entity can be: { id, name, email, ... } or a number (user id) or a string
  if (!entity && entity !== 0) return 'Usuario';
  // If it's a number or a numeric string, show as Usuario #<id>
  if (typeof entity === 'number' || (typeof entity === 'string' && /^\d+$/.test(entity))) {
    return `Usuario #${entity}`;
  }
  // If it's an object, prefer name, then email, then id
  if (typeof entity === 'object') {
    if (entity.name && !/^\d+$/.test(String(entity.name))) return entity.name;
    if (entity.email) return entity.email.split('@')[0];
    if (entity.user && typeof entity.user === 'number') return `Usuario #${entity.user}`;
    if (entity.id) return entity.id && `Usuario #${entity.id}`;
  }
  return String(entity);
}

export function getDisplayEmail(entity) {
  if (!entity) return '';
  if (typeof entity === 'object') {
    if (entity.email) return entity.email;
    if (entity.user && typeof entity.user === 'object' && entity.user.email) return entity.user.email;
    if (entity.user && (typeof entity.user === 'number' || /^\d+$/.test(String(entity.user)))) return '';
  }
  // If entity is a simple email string
  if (typeof entity === 'string' && entity.includes('@')) return entity;
  return '';
}
