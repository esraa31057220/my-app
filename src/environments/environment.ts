/**
 * Local `ng serve`: browser calls `/api/...` (same origin). `proxy.conf.json` forwards to the .NET API.
 * Set `apiServerOrigin` so relative image paths from the API resolve to the real host.
 */
export const environment = {
  production: false,
  apiUrl: '/api',
  apiServerOrigin: 'https://localhost:7237',
};
