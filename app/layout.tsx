import type { Metadata } from "next";
import { Geist, Geist_Mono, Lato } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Lato, the NLAPC brand face, for headings and the readout figure.
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "NL Eats, income support vs. the cost of healthy eating",
  description:
    "An interactive, fully-cited look at how a Newfoundland & Labrador household's monthly income support falls short of the cost of healthy eating. Evidence for the NL Anti-Poverty Coalition.",
};

// Resolve light/dark/system to a data-theme value before first paint (no flash).
// ThemeToggle applies the same resolution and keeps it in sync at runtime.
const themeScript = `(function(){try{var m=localStorage.getItem('nleats-theme');var d=(m==='dark')||((m===null||m==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${lato.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
