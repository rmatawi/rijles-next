import { NextResponse } from "next/server";

export function proxy(request) {
  const url = request.nextUrl.clone();

  // Legacy links: /?page=profile -> /profile
  const page = url.searchParams.get("page");
  if (url.pathname === "/" && page) {
    url.pathname = page === "home" ? "/" : `/${page}`;
    url.searchParams.delete("page");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
