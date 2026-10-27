import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: no admin cookie → straight to login, without rendering the admin shell.
// The real check (signature + expiry) happens in requireAdmin() / isAdmin() on the server.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("ifcwise_admin")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
