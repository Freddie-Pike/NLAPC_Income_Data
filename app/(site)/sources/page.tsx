import PageHeader from "@/app/components/PageHeader";
import SourcesMethodology from "@/app/components/SourcesMethodology";
import { loadGraphDataWithFallback } from "@/lib/load-graph-data";
import { siteCopy } from "@/lib/site-copy";

/**
 * Sources & methodology. The proof surface for a visitor who won't touch the
 * charts: every figure's primary source, grouped by what it backs, plus the method
 * notes. Server-loads the dataset so the derived poverty claim uses the same
 * numbers the charts show.
 */
export default async function SourcesPage() {
  const { data } = await loadGraphDataWithFallback();

  return (
    <>
      <PageHeader
        eyebrow="The evidence"
        title="Sources & methodology"
        intro={siteCopy.sourcesIntro}
      />
      <SourcesMethodology
        households={data.households}
        intro={siteCopy.sourcesIntro}
        showHeading={false}
      />
    </>
  );
}
