import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

export default function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;

  // 環境変数が未設定（ローカルなど）なら認証しない
  if (!user || !pass) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get("authorization");

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    if (authValue) {
      try {
        const [u, p] = atob(authValue).split(":");
        if (u === user && p === pass) {
          return NextResponse.next();
        }
      } catch {
        // invalid base64
      }
    }
  }

  return new NextResponse("Basic認証が必要です", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="tamable", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
