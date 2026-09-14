import { useEffect, useState } from 'react';
import App from './App';
import Admin from './pages/Admin';

/**
 * 해시로만 화면을 가른다. 라우터를 넣을 만큼 화면이 많지 않고,
 * GitHub Pages 처럼 서버 설정을 못 건드리는 곳에서도 그대로 동작한다.
 */
const ADMIN = '#/admin';

export default function Root() {
  const [hash, setHash] = useState(() =>
    typeof window === 'undefined' ? '' : window.location.hash,
  );

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  if (hash.startsWith(ADMIN)) {
    return (
      <Admin
        onExit={() => {
          window.location.hash = '';
          setHash('');
        }}
      />
    );
  }

  return (
    <App
      onOpenAdmin={() => {
        window.location.hash = ADMIN;
        setHash(ADMIN);
      }}
    />
  );
}
