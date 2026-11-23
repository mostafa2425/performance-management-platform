const DEFAULT_API_ORIGIN="http://89.117.49.160:8008";
const API_VERSION_PREFIX="/api/v1";
function normalizeBaseUrl(value?:string):string{const raw=(value||DEFAULT_API_ORIGIN).trim().replace(/\/+$/,"");const url=new URL(raw);const path=url.pathname.replace(/\/+$/,"");if(path.endsWith(API_VERSION_PREFIX))return url.toString().replace(/\/+$/,"");return `${url.origin}${path}${API_VERSION_PREFIX}`;}
export const API_UPSTREAM_BASE_URL=normalizeBaseUrl(process.env.PMP_API_ORIGIN);