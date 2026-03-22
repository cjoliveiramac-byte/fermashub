import { withAuth } from "next-auth/middleware";

const isPublicPath = (pathname) => {
  return (
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname.startsWith("/api/auth")
  );
};

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const pathname = req.nextUrl.pathname;

      if (isPublicPath(pathname)) {
        return true;
      }

      if (!token) {
        return false;
      }

      if (
        pathname.startsWith("/dev") ||
        pathname.startsWith("/painel-desenvolvedor") ||
        pathname.startsWith("/api/dev")
      ) {
        return token?.role === "developer";
      }
      if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        return ["developer", "moderator"].includes(token?.role);
      }
      if (
        pathname.startsWith("/moderator") ||
        pathname.startsWith("/painel-moderacao") ||
        pathname.startsWith("/api/moderation")
      ) {
        return ["developer", "moderator"].includes(token?.role);
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|api).*)",
    "/api/moderation/:path*",
    "/api/dev/:path*",
    "/api/admin/:path*",
  ],
};
