import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fully public — accessible without a session cookie
const PUBLIC_PATHS = ["/", "/login", "/devnet-access"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow through
    if (pathname.startsWith("/invite/"))    return NextResponse.next();
    if (pathname.startsWith("/onboarding")) return NextResponse.next();

    const isPublic = PUBLIC_PATHS.some((p) =>
        p === "/" ? pathname === "/" : pathname.startsWith(p)
    );

    const hasSession =
        request.cookies.has("sol_access") || request.cookies.has("sol_refresh");

    // Unauthenticated user on a protected route → send to /login
    if (!hasSession && !isPublic) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // NOTE: We do NOT redirect authenticated users away from /login or /devnet-access
    // here. The login page owns that logic (useEffect checks isAuthenticated from
    // AuthContext, which validates the session properly via Privy + apiRefresh).
    // Doing it in middleware based on cookie presence alone causes false redirects
    // when cookies are stale or the refresh token has expired.

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
