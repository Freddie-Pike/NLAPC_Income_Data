import PageHeader from "@/app/components/PageHeader";
import BelowTheLineView from "@/app/components/BelowTheLineView";

/**
 * Below the line. The systemic view: every modelled household measured against its
 * own poverty line, so the pattern (not one household) is the point.
 */
export default function BelowTheLinePage() {
  return (
    <>
      <PageHeader
        eyebrow="Every household"
        title="Below the poverty line"
        intro="It is not one unlucky household. Every household modelled here earns less than Canada's official poverty line, even counting every support, and most fall deep below it. Each grid is a household's total income measured against its own line, one square per percent."
      />
      <BelowTheLineView />
    </>
  );
}
