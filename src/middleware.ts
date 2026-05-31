import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { edgeConfig } from "@/lib/auth/edge-config";

const { auth } = NextAuth(edgeConfig);

export default auth((req) => {
  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/weddings/:path*", "/settings/:path*"],
};
