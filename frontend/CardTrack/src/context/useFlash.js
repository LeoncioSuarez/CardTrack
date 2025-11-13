import { useContext } from 'react';
import { FlashContext } from './flashContextValue.js';

// Hook separado para poder exportarlo desde un archivo distinto y evitar
// el warning de Fast Refresh que requiere que el archivo del provider
// solo exporte componentes.
export const useFlash = () => {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error('useFlash must be used within FlashProvider');
  return ctx;
};

export default useFlash;
