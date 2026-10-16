import { useEffect, useState } from 'react';

export default function Avatar({ src, name = '', className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('') || 'DC';
  return (
    <span className={`avatar ${className}`} role="img" aria-label={name ? `Photo de ${name}` : 'Photo de profil'}>
      {src && !failed ? <img src={src} alt="" onError={() => setFailed(true)} /> : initials}
    </span>
  );
}
