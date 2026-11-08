import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/eo/pages/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ERROR OPTIMIZER Prototype" },
      {
        name: "description",
        content:
          "Browser prototype of the ERROR OPTIMIZER V3 dashboard: telemetry, optimization status, quick actions. Simulated data only.",
      },
      { property: "og:title", content: "Dashboard — ERROR OPTIMIZER Prototype" },
      {
        property: "og:description",
        content: "Visual and interaction blueprint of the ERROR OPTIMIZER WPF desktop app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});
