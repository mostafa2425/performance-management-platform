import { API_UPSTREAM_BASE_URL } from "@/lib/api/server-config";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type RouteContext={params:Promise<{path:string[]}>};
async function proxy(request:Request,context:RouteContext){
 const {path=[]}=await context.params;
 const upstreamUrl=new URL(`${API_UPSTREAM_BASE_URL}/${path.map(segment=>encodeURIComponent(segment)).join("/")}`);
 upstreamUrl.search=new URL(request.url).search;
 const headers=new Headers();
 for(const name of ["accept","accept-language","authorization","content-type","if-match","if-none-match","range"]){const value=request.headers.get(name);if(value)headers.set(name,value);}
 const method=request.method.toUpperCase();
 const body=method==="GET"||method==="HEAD"?undefined:await request.arrayBuffer();
 const upstream=await fetch(upstreamUrl,{method,headers,body:body&&body.byteLength?body:undefined,cache:"no-store",redirect:"manual"});
 const responseHeaders=new Headers();
 for(const name of ["content-type","content-disposition","content-length","cache-control","retry-after","etag","last-modified"]){const value=upstream.headers.get(name);if(value)responseHeaders.set(name,value);}
 responseHeaders.set("cache-control","no-store");
 return new Response(upstream.body,{status:upstream.status,statusText:upstream.statusText,headers:responseHeaders});
}
export const GET=proxy;
export const POST=proxy;
export const PUT=proxy;
export const PATCH=proxy;
export const DELETE=proxy;
export const HEAD=proxy;