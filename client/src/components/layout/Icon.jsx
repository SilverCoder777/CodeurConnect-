const paths = {
  blocks: 'M3 3h7v7H3Zm0 11h7v7H3Zm11 0h7v7h-7Zm0-11h7v7h-7Z',
  rotate: 'M21 3v6h-6m6 0a9 9 0 1 0-1 9',
  drop: 'M12 3v13m-5-5 5 5 5-5M4 21h16',
  game: 'M6 8h12a4 4 0 0 1 4 4v5a2 2 0 0 1-3 2l-3-3H8l-3 3a2 2 0 0 1-3-2v-5a4 4 0 0 1 4-4Zm0 3v4m-2-2h4m8-1h.01M19 14h.01',
  code: 'm8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 14',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3a4 4 0 0 1 0 8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  logout: 'M9 21H4V3h5m7 14 5-5-5-5m-9 5h14',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  chat: 'M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-.8L3 21l1.8-5A9 9 0 1 1 21 11Z',
  like: 'M7 10v11H3V10Zm0 0 5-8a3 3 0 0 1 2 4l-1 4h6a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7',
  briefcase: 'M8 7V4h8v3M3 7h18v14H3Zm0 5a25 25 0 0 0 18 0m-9-1v4',
  book: 'M3 3h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v16h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3Zm9 2v16',
  edit: 'm16 3 5 5-12 12-6 1 1-6Zm-2 2 5 5',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z'
};

export default function Icon({ name, size = 22, className = '' }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.code} /></svg>;
}
