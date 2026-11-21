import { useEffect, useState } from 'react';

export type Route =
  | { page: 'landing' }
  | { page: 'app'; tab: string | null }
  | { page: 'pew'; church: string | null; lang: string | null }
  | { page: 'pickup'; code: string | null };

function parse(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const [pathPart, queryPart = ''] = clean.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const query = new URLSearchParams(queryPart);
  switch (segments[0]) {
    case 'app':
      return { page: 'app', tab: segments[1] ?? null };
    case 'pew':
      return { page: 'pew', church: query.get('church'), lang: query.get('lang') };
    case 'pickup':
      return { page: 'pickup', code: segments[1] ?? query.get('code') };
    default:
      return { page: 'landing' };
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function go(hash: string): void {
  window.location.hash = hash;
}
