import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import HeaderWrapper from "@/components/header-wrapper";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import ChatBot from "@/components/ChatBot";
import { ThemeProvider } from "@/components/theme-provider";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "SAMPAT — AI Finance Platform",
  description: "Manage your finances intelligently with SAMPAT AI",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${jakarta.variable} ${inter.variable}`}
      >
        <head>
          <link rel="icon" href="/logo-sm.png" sizes="any" />
        </head>
        <body className={`${jakarta.className} antialiased`} suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <HeaderWrapper>
              <Header />
            </HeaderWrapper>
            <main className="min-h-screen">{children}</main>
            <ChatBot />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
