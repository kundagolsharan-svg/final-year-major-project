import React from "react";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import { WelcomeMessage } from "./welcome-message";

const Header = async () => {
  const user = await checkUser();

  return (
    <header className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-slate-800/60 bg-white/75 dark:bg-black/75 backdrop-blur-3xl transition-colors duration-500">
      <nav className="container mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={"/logo.png"}
            alt="SAMPAT Logo"
            width={400}
            height={120}
            className="h-16 w-auto object-contain"
          />
        </Link>

        {/* Center Nav Links - Signed Out */}
        <div className="hidden md:flex items-center space-x-1">
          <SignedOut>
            <a
              href="#features"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
            >
              Testimonials
            </a>
          </SignedOut>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button
                variant="outline"
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 rounded-xl font-semibold"
              >
                Sign In
              </Button>
            </SignInButton>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200">
                <Sparkles size={16} className="mr-2" />
                Get Started Free
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <WelcomeMessage userName={user?.name?.split(" ")[0] || "User"} />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 ring-2 ring-indigo-100 dark:ring-indigo-900",
                },
              }}
            />
          </SignedIn>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Header;
