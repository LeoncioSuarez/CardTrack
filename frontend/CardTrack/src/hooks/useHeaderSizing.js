import { useCallback, useEffect, useRef, useState } from 'react';

// Hook para calcular y mantener la altura máxima de los headers de columnas.
// Se usa para alinear visualmente cabeceras en diferentes columnas.
export default function useHeaderSizing({ columns, editingColumnId, editingColumnTitle, showTaskModal, showAddColumnModal }) {
  const headerRefs = useRef(new Map());
  const [maxHeaderHeight, setMaxHeaderHeight] = useState(0);

  const recalcHeaderHeights = useCallback(() => {
    if (!columns || !columns.length) {
      setMaxHeaderHeight(0);
      return;
    }
    let max = 0;
    columns.forEach((c) => {
      const el = headerRefs.current.get(c.id);
      if (el) {
        const prev = el.style.height;
        el.style.height = 'auto';
        const h = el.offsetHeight;
        el.style.height = prev;
        if (h > max) max = h;
      }
    });
    setMaxHeaderHeight(max);
  }, [columns]);

  useEffect(() => {
    recalcHeaderHeights();
  }, [columns, editingColumnId, editingColumnTitle, showTaskModal, showAddColumnModal, recalcHeaderHeights]);

  useEffect(() => {
    const onResize = () => recalcHeaderHeights();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [recalcHeaderHeights]);

  return { headerRefs, maxHeaderHeight, recalcHeaderHeights };
}
