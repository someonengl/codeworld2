import type { Metadata } from "next";
import { inter, spaceMono } from "./fonts";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Navbar from "./components/Navbar";
import ClientProviders from "./components/ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeWorld | Competitive Programming LMS",
  description: "Community-driven competitive programming platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('username, full_name, is_super_admin').eq('id', user.id).single();
    profile = data;

    // Hardcoded Superadmin Elevation for Project Owner
    if (user.email === 'onlinecasur67@gmail.com' && !profile?.is_super_admin) {
      profile = { ...profile, is_super_admin: true };
    }
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceMono.variable} h-full antialiased dark`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <ClientProviders>
          <Navbar initialUser={user} initialProfile={profile} />
          <main className="flex-1 flex flex-col w-full h-full">
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
