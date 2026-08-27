import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { SupportWidget } from "@/components/layout/support-widget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fidya.ai"),
  title: {
    default: "Fidya — Personalized AI Education Platform",
    template: "%s · Fidya",
  },
  description:
    "Hyper-personalized curricula with 100% grounded citations, powered by the SYNTAX multi-agent system.",
  applicationName: "Fidya",
  openGraph: {
    siteName: "Fidya",
    type: "website",
  },
};

// Theme only changes when the learner explicitly picks one in Settings.
// Never follow the OS preference automatically — a surprise theme flip
// right after sign-in felt like a bug (it was reported as one).
const themeInit = `(function(){try{if(localStorage.getItem("fidya.theme")==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-clip">
        {/* Applies the saved theme before first paint (default: light).
            next/script is required — raw <script> tags are not executed
            inside React components on Next 16 / React 19. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInit}
        </Script>
        <ClerkProvider>
          <AuthProvider>
          <ToastProvider>
          <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-white"
          >
          Skip to content
          </a>
          <Navbar />
          <main id="main-content" className="flex w-full flex-1 flex-col pt-20 pb-10">
          {children}
          </main>
          <Footer />
          <SupportWidget />
          </ToastProvider>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}