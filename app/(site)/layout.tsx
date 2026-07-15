import { cookies } from "next/headers";
import SiteNav from "@/app/components/SiteNav";
import SiteFooter from "@/app/components/SiteFooter";
import HouseholdProvider from "@/app/components/HouseholdProvider";
import { AUTH_COOKIE, isGateEnabled, verifyToken } from "@/lib/auth";

/**
 * The site shell, shared by every page (one route per nav tab). The auth gate
 * screen at /gate lives OUTSIDE this route group, so it never renders the nav.
 *
 * HouseholdProvider stays mounted across client-side navigation, so the visitor's
 * chosen household follows them from page to page. cookies() is read per request
 * (never a static prerender) so the sign-out control and the gate toggle stay live.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const showSignOut = isGateEnabled() && verifyToken(token);

  return (
    <HouseholdProvider>
      <SiteNav showSignOut={showSignOut} />
      <main
        id="main"
        className="mx-auto grid max-w-[1160px] gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10 lg:px-8"
      >
        {children}
      </main>
      <SiteFooter />
    </HouseholdProvider>
  );
}
