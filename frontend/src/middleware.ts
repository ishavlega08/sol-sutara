import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth is handled entirely client-side via AuthContext + the 401 → refresh
// interceptor in lib/api/client.ts. The backend sets httpOnly cookies on its
// own origin, so they are never visible to this middleware — any server-side
// cookie check here would always fail for cross-origin deployments and create
// an infinite redirect loop. Route protection lives in the client.
export function middleware(_request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
