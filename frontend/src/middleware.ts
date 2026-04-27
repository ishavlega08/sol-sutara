import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Invite pages are publicly accessible (the page handles auth internally)
    if (pathname.startsWith("/invite/")) return NextResponse.next();
    // Onboarding is accessible to authenticated users regardless of org status
    if (pathname.startsWith("/onboarding")) return NextResponse.next();

    const hasSession =
        request.cookies.has("sol_access") || request.cookies.has("sol_refresh");

    // Unauthenticated → send to /login, preserving intended destination
    if (!hasSession && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // Authenticated user on /login → send to dashboard
    if (hasSession && PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
