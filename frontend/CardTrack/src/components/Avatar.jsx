import React, { useState, useEffect } from 'react';

const RAW_BASE = import.meta?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const API_BASE = RAW_BASE.replace(/\/api\/?$/, '');
const DEFAULT_PROFILE = API_BASE + '/media/profilepic/default.jpg';

const Avatar = ({ src, defaultSrc = DEFAULT_PROFILE, alt = '', className = '', size = 48, style = {} }) => {
  const [current, setCurrent] = useState(defaultSrc);

  useEffect(() => {
    let mounted = true;
    // Always show default first
    setCurrent(defaultSrc);
    if (!src) return () => { mounted = false; };
    const img = new Image();
    img.onload = () => { if (mounted) setCurrent(src); };
    img.onerror = () => { if (mounted) setCurrent(defaultSrc); };
    img.src = src;
    return () => { mounted = false; };
  }, [src, defaultSrc]);

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: 6, ...style }}
    />
  );
};

export default Avatar;
