// Browser-safe configuration only. Requests go through the same-origin Next.js API proxy.
export const API_BASE_URL="/api/pmp";
export const API_TIMEOUT_MS=Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS||30000);
export const AUTH_STORAGE_KEY="pmp.auth.session";
export const AUTH_UNAUTHORIZED_EVENT="pmp:unauthorized";