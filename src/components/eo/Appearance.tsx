import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const AppearanceContext = createContext({
  reduced: false,
  animations: true,
  transitions: true,
  depth: "MEDIUM (3D)",
  accent: 0,
  setReduced: (_: boolean) => {},
  setAnimations: (_: boolean) => {},
  setTransitions: (_: boolean) => {},
  setDepth: (_: string) => {},
  setAccent: (_: number) => {},
});

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [transitions, setTransitions] = useState(true);
  const [depth, setDepth] = useState("MEDIUM (3D)");
  const [accent, setAccent] = useState(0);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset["motion"] = reduced || systemReduced || !animations ? "reduced" : "full";
    root.dataset["transitions"] = transitions ? "on" : "off";
    root.dataset["depth"] = depth.startsWith("LOW")
      ? "flat"
      : depth.startsWith("HIGH")
        ? "deep"
        : "subtle";
    root.dataset["accent"] = String(accent);
  }, [reduced, systemReduced, animations, transitions, depth, accent]);
  return (
    <AppearanceContext.Provider
      value={{
        reduced,
        animations,
        transitions,
        depth,
        accent,
        setReduced,
        setAnimations,
        setTransitions,
        setDepth,
        setAccent,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export const useAppearance = () => useContext(AppearanceContext);
