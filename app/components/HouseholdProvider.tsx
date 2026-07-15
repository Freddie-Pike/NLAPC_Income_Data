"use client";

/**
 * HouseholdProvider, the one piece of state shared across pages.
 *
 * The site is multi-page (one route per nav tab), but the visitor's chosen
 * household should follow them: pick "Couple" on the gap page, and the income and
 * below-the-line pages open on the couple too. This context lives in the site
 * layout, which stays mounted across client-side navigation, so the selection
 * persists without a URL param. The food budget is NOT here: it is only
 * interactive on the gap page, so it stays local to that page.
 */

import { createContext, useContext, useState } from "react";
import type { HouseholdId } from "@/lib/graph-data";

export const DEFAULT_HOUSEHOLD: HouseholdId = "family4";

interface HouseholdContextValue {
  householdId: HouseholdId;
  setHouseholdId: (id: HouseholdId) => void;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (!ctx) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return ctx;
}

export default function HouseholdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [householdId, setHouseholdId] =
    useState<HouseholdId>(DEFAULT_HOUSEHOLD);
  return (
    <HouseholdContext.Provider value={{ householdId, setHouseholdId }}>
      {children}
    </HouseholdContext.Provider>
  );
}
