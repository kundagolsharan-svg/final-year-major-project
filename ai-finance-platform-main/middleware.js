import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/transaction(.*)",
]);

// Create base Clerk middleware
const clerk = clerkMiddleware(async (auth, req) => {
  try {
    const { userId, redirectToSignIn } = await auth();

    if (!userId && isProtectedRoute(req)) {
      return redirectToSignIn();
    }

    return NextResponse.next();
  } catch (error) {
    // Check if this is a Next.js redirect error (thrown by Clerk's redirectToSignIn) and re-throw it
    if (error instanceof Error && (error.message === "NEXT_REDIRECT" || error.digest?.startsWith("NEXT_REDIRECT"))) {
      throw error;
    }
    return new NextResponse("Middleware Error: " + error.message, { status: 500 });
  }
});

export default clerk;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
