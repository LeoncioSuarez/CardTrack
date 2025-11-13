import { createContext } from 'react';

// Separar la creación del contexto a un archivo propio para que el provider
// permanezca en `FlashContext.jsx` exportando únicamente componentes.
export const FlashContext = createContext(null);

export default FlashContext;
