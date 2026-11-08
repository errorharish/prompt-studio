import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { V4_REDIRECTS, pageBySlug } from "@/lib/eo/registry";
import { PAGE_COMPONENTS } from "@/components/eo/pageMap";
import { PageGuideContext } from "@/components/eo/Guide";
import { pageGuide } from "@/lib/eo/guides";

export const Route = createFileRoute("/$page")({
  loader: ({ params }) => {
    const moved = V4_REDIRECTS[params.page];
    if (moved) throw redirect({ to: "/$page", params: { page: moved }, replace: true });
    const p = pageBySlug(params.page);
    if (!p || !PAGE_COMPONENTS[params.page]) throw notFound();
    return { title: p.title, description: p.description, suite: p.suite };
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.title} — ERROR OPTIMIZER ${loaderData.suite}`
      : "Unavailable — ERROR OPTIMIZER";
    const description = loaderData?.description ?? "Page not found.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: PageRoute,
});

function PageRoute() {
  const { page } = Route.useParams();
  const C = PAGE_COMPONENTS[page];
  return (
    <PageGuideContext.Provider value={pageGuide(page)}>{C ? C() : null}</PageGuideContext.Provider>
  );
}
