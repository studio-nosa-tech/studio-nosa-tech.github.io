import type { APIRoute } from 'astro';
import release from '../data/release.json';

// Public machine-readable release manifest. The same file is used to build
// the site and is archived in the zignos repository under releases/.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(release, null, 2) + '\n', {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
