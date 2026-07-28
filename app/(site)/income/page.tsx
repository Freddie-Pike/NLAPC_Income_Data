import PageHeader from "@/app/components/PageHeader";
import IncomeMakeupExplorer from "@/app/components/IncomeMakeupExplorer";

/**
 * Income makeup. Where the money comes from: the selected household's income broken
 * out program by program, largest first, with the honest note that the housing
 * benefit only reimburses rent.
 */
export default function IncomePage() {
  return (
    <>
      <PageHeader
        eyebrow="Where it comes from"
        title="What the income is made of"
        intro="A household's monthly income is a patchwork of provincial and federal programs, one or two large, several tiny. Pick a household to see each program, largest first, and note that the housing benefit only reimburses rent, it cannot be spent on food."
      />
      <IncomeMakeupExplorer />
    </>
  );
}
