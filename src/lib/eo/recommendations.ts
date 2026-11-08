import { ONE_CLICK_ACTIONS } from "./data";

export function filterRecommendations(area: string | null, filter: string, query: string) {
  return ONE_CLICK_ACTIONS.filter((action) => {
    if (area && action.group !== area) return false;
    if (!`${action.title} ${action.desc}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (["Optional", "Already Optimized", "Protected Items"].includes(filter)) return false;
    if (filter === "Requires Restart") return action.restart;
    if (["Can Optimize Now", "Background-Safe"].includes(filter)) return !action.restart;
    if (
      ["System Performance", "Background Workload", "Memory", "Power / Performance"].includes(
        filter,
      )
    )
      return action.group === filter.toUpperCase();
    return true;
  });
}
