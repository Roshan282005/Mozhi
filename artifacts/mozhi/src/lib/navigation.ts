import { useLocation } from 'wouter';

export { Link, useParams, useRoute } from 'wouter';

export function useRouter() {
  const [, setLocation] = useLocation();
  return {
    push: (path: string) => setLocation(path),
    replace: (path: string) => setLocation(path, { replace: true }),
    back: () => window.history.back(),
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
  };
}

export function useSearchParams() {
  const searchString = typeof window !== 'undefined' ? window.location.search : '';
  const params = new URLSearchParams(searchString);
  return params;
}

export function usePathname() {
  const [location] = useLocation();
  return location;
}

export function notFound() {
  console.error('Not found - page does not exist');
}
