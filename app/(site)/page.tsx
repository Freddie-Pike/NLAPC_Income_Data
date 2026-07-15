import PageHeader from "@/app/components/PageHeader";
import IncomeCostExplorer from "@/app/components/IncomeCostExplorer";
import { siteCopy } from "@/lib/site-copy";

/**
 * The gap (home). The interactive instrument: one household's income against the
 * cost of healthy eating, with the food budget adjustable and the poverty line
 * always in frame.
 */
export default function GapPage() {
  return (
    <>
      <PageHeader
        eyebrow="The gap"
        title={siteCopy.heroHeadline}
        intro={siteCopy.heroIntro}
        hero
      />
      <IncomeCostExplorer />
    </>
  );
}
