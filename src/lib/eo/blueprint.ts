// WPF handoff data rendered by /blueprint. Every value mirrors src/styles.css or kit.tsx;
// `css` fields are asserted against styles.css in src/test/blueprint-sync.test.ts.

export const TOKENS: [name: string, hex: string, key: string, cls: string][] = [
  ["Canvas", "#050811", "FigmaCanvasBgColor", "bg-background"],
  ["Window", "#080D1A", "FigmaWindowBgColor", "bg-window"],
  ["Card", "#0D1426", "FigmaSecondaryPanelColor", "bg-card"],
  ["Elevated", "#121B33", "FigmaElevatedSurfaceColor", "bg-elevated"],
  ["Border subtle", "#1A2544", "FigmaBorderSubtleColor", "border-border"],
  ["Border medium", "#253560", "FigmaBorderMediumColor", "border-border-strong"],
  ["Electric blue", "#2563EB", "FigmaAccentElectricBlueColor", "bg-primary"],
  ["Cyan highlight", "#38BDF8", "(report) active indicator", "text-cyan"],
  ["Success", "#10B981", "FigmaStatusSuccessColor", "text-success"],
  ["Warning", "#F59E0B", "FigmaStatusWarningColor", "text-warning"],
  ["Danger", "#EF4444", "FigmaStatusDangerColor", "text-destructive"],
  ["Text primary", "#F8FAFC", "FigmaTextPrimaryColor", "text-foreground"],
  ["Text secondary", "#94A3B8", "FigmaTextSecondaryColor", "text-muted-foreground"],
  [
    "Text muted",
    "#77879F",
    "FigmaTextMutedColor (lifted from #64748B for contrast)",
    "text-subtle",
  ],
];

export const NAVIGATION: { area: string; detail: string }[] = [
  {
    area: "Suite switch",
    detail:
      "Title-bar V3/V4 pill (two toggle buttons, aria-pressed). V3 → Dashboard; V4 → Maximum Performance tab.",
  },
  {
    area: "V3 dock",
    detail:
      "GlassSidebarDock, 84px wide (60px collapsed to icons, toggle at the bottom, remembered per browser), 19 entries in 5 separator groups. One shared active indicator (cyan tint + 3px cyan bar) slides between items; aria-current=page. Items tighten on windows under 860px tall.",
  },
  {
    area: "V4 sidebar",
    detail:
      "Same 84px / 60px vertical dock as V3, listing only V4 pages in three groups: HOME (V4 Performance Center) · MAX PERF · EMULATOR, DEBLOAT, ADVANCED (five destinations). Shared sliding indicator; V3 pages never appear.",
  },
  {
    area: "Unrouted pages",
    detail:
      "One-Click, Auto Optimize, Process Reduction, Service Manager, Performance Tuning, V4 Dashboard: reached from in-page links only.",
  },
  {
    area: "Routing",
    detail:
      "One registry (route key → XAML view → ViewModel). In WPF: MainViewModel route factory + DataTemplates in App.xaml.",
  },
  {
    area: "Keyboard",
    detail:
      "Skip link to content; Tab order: title bar → dock/tabs → page → sticky action bar. Esc closes dialogs and popovers.",
  },
];

export const TYPE_SCALE: { role: string; size: string; weight: string; notes: string }[] = [
  {
    role: "Page title (h1)",
    size: "20px",
    weight: "700",
    notes: "Uppercase; 1-Click hero uses 26px / 900",
  },
  {
    role: "Section title (h2)",
    size: "11.5px",
    weight: "700",
    notes: "Uppercase, 1×14px cyan accent bar",
  },
  { role: "Caption / label", size: "10.5px", weight: "700", notes: "Uppercase (eo-label)" },
  { role: "Body", size: "13px", weight: "400", notes: "Subtitles 13px; rows 12.5px; hints 11.5px" },
  {
    role: "Stat value",
    size: "22px",
    weight: "700",
    notes: "Tabular numerals; dashboard tiles 30px",
  },
  { role: "Badge", size: "9.5px", weight: "700", notes: "Uppercase, 4px radius" },
  { role: "Button", size: "10.5px", weight: "700", notes: "sm 10px · lg 12px; uppercase" },
  {
    role: "Mono",
    size: "11–11.5px",
    weight: "400",
    notes: "Cascadia Code → JetBrains Mono → Consolas",
  },
];

export const SPACING: [role: string, value: string][] = [
  ["Shell", "Title bar 48px · footer 32px · dock 84px / 60px (V3 and V4)"],
  ["Page padding", "16px × 20px (14px under 760px)"],
  ["Section gap", "16px"],
  ["Card padding", "16px"],
  ["Tile / grid gap", "10px"],
  ["Stat tile padding", "10px × 12px"],
  ["Row padding", "10px vertical, 12px horizontal"],
  ["Buttons", "sm 28px · md 32px · lg 40px tall"],
  ["Sticky action bar", "10px × 20px, floating glass"],
  ["Radii", "4px badges · 8px cards, buttons, inputs, rows · full pills"],
];

export const DEPTH: { name: string; css: string; use: string }[] = [
  {
    name: "Card",
    css: "--shadow-card",
    use: "Resting cards: 1px inner top highlight + 2px contact shadow + soft 28px drop.",
  },
  {
    name: "Elevated",
    css: "--shadow-elevated",
    use: "Card / tile hover: three-layer shadow plus a faint cyan rim; tiles lift 2px.",
  },
  { name: "Pressed", css: "--shadow-pressed", use: "Button press: inner shadow + 1px drop." },
  { name: "Glow", css: "--shadow-glow", use: "Primary buttons, active area, current step." },
  {
    name: "Overlay",
    css: "--overlay-shadow",
    use: "Dialogs, menus and toasts (layered 12px + 90px drop).",
  },
  {
    name: "Chrome glass",
    css: "--glass-blur-chrome",
    use: "Title bar, dock, footer: 72% surface + 14px blur. WPF: AcrylicBrush / Mica.",
  },
  {
    name: "Floating glass",
    css: "--glass-blur-float",
    use: "Dialogs, menus, toasts, sticky bars: 80% surface + 20px blur. Dense data cards get no blur.",
  },
  {
    name: "Hero glass",
    css: "--glass-blur-panel",
    use: "Score, Auto Optimize, RAM Limiter, telemetry console and V4 primary workspaces: 66% surface + 12px blur, cyan-tinted rim, inner 1px edge. WPF: AcrylicBrush on the hero Border only.",
  },
  {
    name: "Lit top edge",
    css: "--edge-highlight",
    use: "1px cyan gradient line across the top of hero panels (fades out at both ends).",
  },
  {
    name: "Pointer light",
    css: "--light-x",
    use: "Mouse-following 7% cyan highlight on card hover. Off on touch, LOW depth and reduced motion.",
  },
  {
    name: "Tilt",
    css: "--tilt-x",
    use: "Mouse-only tilt, max ±0.8°, only on cards ≥340×180px without form fields. Off when depth = LOW, on touch or motion reduced. HIGH (DEEP) deepens card shadows and hover lift.",
  },
];

export const MOTION: {
  name: string;
  duration: string;
  easing: string;
  css: string;
  wpf: string;
}[] = [
  {
    name: "Colour / background",
    duration: "120ms",
    easing: "linear",
    css: "--duration-fast: 120ms",
    wpf: "ColorAnimation 0:0:0.12",
  },
  {
    name: "Border, transform, shadow",
    duration: "180ms",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "--duration-control: 180ms",
    wpf: "DoubleAnimation 0:0:0.18",
  },
  {
    name: "Spring (thumbs, icons, indicators)",
    duration: "180–320ms",
    easing: "cubic-bezier(.34,1.4,.64,1)",
    css: "--ease-spring: cubic-bezier(.34,1.4,.64,1)",
    wpf: "BackEase Amplitude 0.3, EasingMode=EaseOut",
  },
  {
    name: "Page enter",
    duration: "380ms",
    easing: "cubic-bezier(.16,1,.3,1)",
    css: "--duration-page: 380ms",
    wpf: "PageTransitionHost: Opacity 0→1 + TranslateY 8→0, KeySpline 0.16,1 0.3,1",
  },
  {
    name: "Section stagger",
    duration: "380ms, +40ms each (max 5 steps)",
    easing: "cubic-bezier(.16,1,.3,1)",
    css: "--stagger: 40ms",
    wpf: "BeginTime offsets 0 / 40 / 80 / 120 / 160 / 200ms",
  },
  {
    name: "Active indicator slide",
    duration: "320ms",
    easing: "spring",
    css: "transform var(--duration-slow) var(--ease-spring)",
    wpf: "One shared Border; animate TranslateTransform.Y (dock) / X (tabs)",
  },
  {
    name: "Hover lift",
    duration: "180ms",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "--lift-hover: -2px",
    wpf: "TranslateTransform.Y → -2 on IsMouseOver (tiles)",
  },
  {
    name: "Dialog in",
    duration: "300ms",
    easing: "cubic-bezier(.16,1,.3,1)",
    css: "--duration-dialog: 300ms",
    wpf: "Opacity 0→1, TranslateY 14→0, Scale 0.965→1",
  },
  {
    name: "Dialog out",
    duration: "200ms",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "eo-dialog-out 200ms",
    wpf: "Opacity →0, TranslateY →6, Scale →0.98; then Collapse",
  },
  {
    name: "Overlay fade",
    duration: "220ms in / 200ms out",
    easing: "ease",
    css: "eo-overlay-in 220ms",
    wpf: "Scrim Opacity animation + 6px background blur",
  },
  {
    name: "Menu / popover",
    duration: "160ms",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "eo-pop-in 160ms",
    wpf: "Popup: Opacity 0→1, TranslateY -4→0, Scale 0.97→1 from top-right",
  },
  {
    name: "Expander",
    duration: "180ms",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "grid-template-rows var(--duration-control)",
    wpf: "Expander content: animate LayoutTransform ScaleY or Height",
  },
  {
    name: "Card tilt",
    duration: "260ms",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "transform 260ms",
    wpf: "Optional; prefer elevation change over 3D in WPF",
  },
  {
    name: "Primary sheen",
    duration: "600ms",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "transform 600ms",
    wpf: "Hover-only gradient sweep (OpacityMask offset)",
  },
  {
    name: "Chart draw",
    duration: "800ms",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "eo-chart-draw 800ms",
    wpf: "StrokeDashOffset animation on Path",
  },
  {
    name: "Progress sheen",
    duration: "1.6s loop, running bars only",
    easing: "linear",
    css: "eo-sheen 1.6s",
    wpf: "Gradient offset animation while IsRunning",
  },
  {
    name: "Skeleton shimmer",
    duration: "1.3s loop",
    easing: "linear",
    css: "eo-shimmer 1.3s",
    wpf: "LinearGradientBrush offset animation, RepeatBehavior=Forever",
  },
  {
    name: "Large entrance (hero panels, staggered workspaces)",
    duration: "440ms, +60ms per child (max 4 steps)",
    easing: "cubic-bezier(.16,1,.3,1)",
    css: "--duration-entrance: 440ms",
    wpf: "Storyboard: Opacity 0→1 + TranslateY 10→0 (Scale 0.992→1 on hero), BeginTime offsets",
  },
  {
    name: "Score gauge fill + count-up",
    duration: "900ms",
    easing: "cubic-bezier(.16,1,.3,1)",
    css: "eo-score-in var(--duration-score)",
    wpf: "Arc StrokeDashOffset + Int32Animation on the score text; skip when animations are off",
  },
  {
    name: "Segmented indicator slide",
    duration: "320ms",
    easing: "spring",
    css: "transform var(--duration-slow) var(--ease-spring), width var(--duration-slow)",
    wpf: "Single Border behind the RadioButtons; animate TranslateTransform.X and Width",
  },
  {
    name: "Slider thumb hover / press",
    duration: "120ms scale, 180ms halo",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-control)",
    wpf: "Thumb ScaleTransform 1→1.06 (hover) / 1.14 (drag); halo via DropShadowEffect. Track fill has no animation.",
  },
  {
    name: "Chart morph between samples",
    duration: "320ms",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "transition: d var(--duration-slow)",
    wpf: "PointAnimation per Path point, or redraw without animation",
  },
  {
    name: "Tab / module content swap",
    duration: "320ms",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "eo-rise-in var(--duration-slow)",
    wpf: "ContentControl transition: Opacity 0→1 + TranslateY 8→0",
  },
  {
    name: "Analysis sweep",
    duration: "1.4s loop while analyzing",
    easing: "cubic-bezier(.2,.8,.2,1)",
    css: "eo-scan 1.4s",
    wpf: "Gradient Rectangle TranslateTransform.Y loop while IsAnalyzing",
  },
  {
    name: "Completion",
    duration: "420ms",
    easing: "spring",
    css: "eo-success-pop 420ms",
    wpf: "Result card: Opacity + TranslateY 8→0 + Scale 0.98→1",
  },
];

export const STATES: { state: string; spec: string }[] = [
  {
    state: "Hover",
    spec: "Secondary button: border cyan 50% + highlight fill; icons nudge 1px. Primary: brighter glow + one light sweep. Card: edge-light border, elevated shadow, pointer light. Tiles lift 2px. Rows: border-strong + faint fill.",
  },
  {
    state: "Pressed",
    spec: "translateY(1px) scale(0.99); buttons scale(0.98) + inner pressed shadow.",
  },
  {
    state: "Busy",
    spec: "Btn loading: spinner + aria-busy, clicks blocked. Running progress bars show a moving sheen.",
  },
  {
    state: "Focus",
    spec: "2px cyan outline, 3px offset, keyboard focus only (focus-visible). WPF: FocusVisualStyle.",
  },
  {
    state: "Selected",
    spec: "Rows: cyan 40% border + cyan 5% fill. Chips: cyan 50% border + cyan 15% fill (aria-pressed).",
  },
  { state: "Disabled", spec: "40% opacity, no pointer events." },
  {
    state: "Slider",
    spec: "Hover: thumb 1.06 + 5px cyan halo. Drag: 1.14 + 7px halo. Focus: 2px canvas gap + 2px cyan ring on the thumb (no outline on the track).",
  },
  {
    state: "Engine / scope step",
    spec: "READY muted · RUNNING cyan border + glow + pulsing icon · SIMULATED / APPLIED green · NEEDS ADB amber with lock node.",
  },
  { state: "Current step", spec: "Cyan pill + glow; done steps green with check; upcoming muted." },
];

export const MODAL_SPEC: string[] = [
  "Scrim: canvas colour at 75% + 4px background blur; click outside closes.",
  "Dialog: floating glass (80% surface + 20px blur), max-height 86vh, header / scroll body / tinted footer, 8px radius, overlay shadow.",
  "Menus and popovers share the floating glass and open from their anchor corner (eo-pop-in).",
  "Focus moves into the dialog, Tab is trapped, Esc closes, focus returns to the trigger.",
  "Run flow (UniversalOptimizationModal): Approve → Restore point → 5 stages → summary. The prototype summary reports 0 changes on this PC.",
];

export const REDUCED_MOTION: string[] = [
  "System prefers-reduced-motion, Settings → Reduced Motion, or UI Animations off: every animation and transition is removed and card tilt is disabled.",
  "Page Transitions off: only page and section entrance animations are removed.",
  "3D Spatial Depth LOW (2D): tilt and pointer light removed, shadows kept. HIGH (DEEP): deeper card shadows and a 3px hover lift.",
  "Touch / no-hover devices: tilt, pointer light and hover lift are disabled.",
  "WPF: read SystemParameters.ClientAreaAnimation and the app setting; skip Storyboards when either is off.",
];

export const COMPONENT_MAP: { web: string; wpf: string; note: string }[] = [
  {
    web: "CheckRow + SelectionBar",
    wpf: "ToggleButton (CheckRowStyle) in ItemsControl + header TextBlock and Select all / Clear",
    note: "Whole row is one checkbox. First use selects every eligible item; protected rows show a lock and are never selectable. Selection persists per page and per profile (OptimizationSelectionStore).",
  },
  {
    web: "Quick action card",
    wpf: "Button · QuickActionCardStyle + DashboardViewModel.RunQuickActionCommand",
    note: "Only One-Click navigates. Others run one task in place with a compact progress dialog; other cards are disabled while one runs.",
  },
  {
    web: "V4 sidebar dock",
    wpf: "MainWindow V4 NavigationDock (same ListBox template as V3) with sliding SelectionIndicator",
    note: "Seven entries starting with the V4 Performance Center; each V4 page has its own item.",
  },
  {
    web: "GuideTip (section help popover)",
    wpf: "Help glyph Button + Popup (StaysOpen=False) bound to a Guide resource",
    note: "Section-level help only (the page header uses the GUIDE button). What / why / when / benefit / restart / reversible, risk line, 'How it works' expander. Esc and outside click close; one open at a time.",
  },
  {
    web: "PageGuide (GUIDE button + guide dialog)",
    wpf: "PageHeader GUIDE Button (book glyph) opening one GuideDialog bound to the page's StepGuide resource",
    note: "Every optimization page, V3 and V4, uses the V4 Maximum Performance design: title, subtitle, numbered sections, close X, Got it. Pages with an original guide keep it verbatim; others show What / How / Benefits / Safety / When / Risks / Reversibility from the guide registry.",
  },
  {
    web: "Hidden scrollbars + edge fade",
    wpf: "ScrollViewer with hidden ScrollBar template and OpacityMask edge fade",
    note: "Scrollbars are never drawn; wheel, touchpad and keyboard scrolling stay on. Edges fade only where more content exists.",
  },
  {
    web: "Suite switcher (V3 / V4)",
    wpf: "Two-segment ToggleButton group with animated thumb (TranslateTransform)",
    note: "Fixed 44px segments so switching never shifts layout.",
  },
  {
    web: "StatTiles (metric strip)",
    wpf: "Border + UniformGrid with 1px separators",
    note: "One panel divided into cells; replaces rows of separate stat cards. Cells wrap by width.",
  },
  {
    web: "BackLink",
    wpf: "Button · BackNavigationStyle (Command=NavigateBack)",
    note: "Pages reached from the Dashboard (Auto Optimize, 1-Click) show ← Back to Dashboard before the title.",
  },
  {
    web: "Details (inline)",
    wpf: "Expander inside the parent panel",
    note: "Advanced settings and technical inventories stay collapsed in the primary view.",
  },
  {
    web: "OpProgress",
    wpf: "ProgressRing + current-operation TextBlock + ProgressBar",
    note: "Shared optimization progress block in run dialogs: percent ring, current stage, items reached.",
  },
  {
    web: "Card",
    wpf: "Border · FigmaCardStyle / GlassCard",
    note: "Gradient surface + 1px border",
  },
  {
    web: "Btn (primary / secondary / ghost / danger / success)",
    wpf: "Theme/Buttons.xaml styles",
    note: "success variant is a prototype addition",
  },
  {
    web: "Badge, RiskBadge",
    wpf: "Theme/Badges.xaml",
    note: "Risk → tone: SAFE/LOW green, MEDIUM amber, HIGH red, PROTECTED cyan",
  },
  { web: "Toggle", wpf: "PremiumToggle", note: "role=switch" },
  { web: "Check", wpf: "CheckBox style", note: "role=checkbox" },
  { web: "Chips", wpf: "RadioButton row (ToggleButton style)", note: "aria-pressed" },
  { web: "Details", wpf: "Expander", note: "Animated open; closed content is inert" },
  { web: "Modal", wpf: "Grid overlay / Popup", note: "See dialog behaviour" },
  {
    web: "RunModal",
    wpf: "Controls/UniversalOptimizationModal.xaml",
    note: "Summary is honest about simulation",
  },
  { web: "StatTiles", wpf: "UniformGrid", note: "cols=*,10,*…" },
  { web: "PageHeader", wpf: "Grid cols=*,Auto", note: "Accent bar + h1 + actions" },
  {
    web: "Stepper",
    wpf: "No original reference",
    note: "New in prototype; horizontal ItemsControl suggested",
  },
  {
    web: "LoadingState",
    wpf: "No original reference",
    note: "New in prototype; shimmer Border suggested",
  },
  { web: "SimNotice", wpf: "None (prototype only)", note: "Omit in the native app" },
  {
    web: "ScoreRing + CountUp",
    wpf: "No original reference (build report HealthGauge)",
    note: "Gradient arc Path + 48 tick Lines; score value is illustrative demo data",
  },
  {
    web: "AutoOptimizePanel",
    wpf: "Dashboard hero card bound to AutoOptimizeViewModel",
    note: "Status pill, countdown, interval track, facts grid, recent maintenance, Enable / Pause / Resume / Run now / Configure",
  },
  {
    web: "AutoChip",
    wpf: "Title-bar Border bound to AutoOptimizeViewModel.NextRunCountdown",
    note: "Hidden while Auto Optimize is disabled",
  },
  {
    web: "Maintenance task group / row",
    wpf: "Grouped ItemsControl (CollectionViewSource GroupDescriptions = Category)",
    note: "Group select-all CheckBox, risk Badge, Expander for details",
  },
  {
    web: "Radio card",
    wpf: "RadioButton with card ControlTemplate",
    note: "role=radio, aria-checked; used for close behaviour",
  },
  {
    web: "Save bar",
    wpf: "Bottom-docked Border, visible when ViewModel.IsDirty",
    note: "Discard / Save & apply; Save disabled while the interval is invalid",
  },
  {
    web: "Segmented",
    wpf: "RadioButton row + sliding Border",
    note: "aria-pressed options; one shared indicator",
  },
  {
    web: "RangeSlider + NumberField",
    wpf: "Slider (custom Track / Thumb template) + TextBox",
    note: "Shared clamp-and-snap rule; see slider behaviour",
  },
  {
    web: "TelemetryConsole",
    wpf: "SystemInfoView telemetry section (Canvas + Path)",
    note: "Moved from the Dashboard; legend toggles, tooltip, window chips",
  },
  {
    web: "Engine pipeline step",
    wpf: "ItemsControl with a vertical connector Line",
    note: "Numbered node shows engine state",
  },
  {
    web: "RestorePointDialog",
    wpf: "Controls/RestorePointDialog.xaml (staged ContentControl per state)",
    note: "Check → System Protection Is Disabled → confirm → enable → verify → create → verify",
  },
  {
    web: "Navigation shortcut tile",
    wpf: "Button + NavigationService.Navigate(routeKey)",
    note: "Never executes an operation",
  },
  {
    web: "Input mode picker",
    wpf: "RadioButton group styled as cards, bound to SelectedMode",
    note: "Normal / Advanced computed; Custom editable + Save / Reset",
  },
  {
    web: "HealthCheck",
    wpf: "SystemInfoView health panel (ScoreRing + ItemsControl)",
    note: "HealthScoreService: weights, worst-reading categories, coverage",
  },
];

/** Future native System Protection / restore point implementation (not in the browser). */
export const NATIVE_RESTORE_POINT: { area: string; detail: string }[] = [
  {
    area: "Status check",
    detail:
      "SystemRestoreService.GetProtectionStatusAsync(systemDrive) reads the drive's protection state (WMI root\\default:SystemRestoreConfig / vssadmin list shadowstorage) for %SystemDrive% only. Group Policy keys DisableSR / DisableConfig under HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\SystemRestore are read to detect a blocked state up front.",
  },
  {
    area: "Disabled dialog",
    detail:
      "When protection is off the ViewModel shows RestorePointDialog in the ProtectionRequired state; nothing is changed until the user presses Enable System Protection and then Confirm.",
  },
  {
    area: "Elevation",
    detail:
      'Enabling runs in the elevated helper (requireAdministrator manifest, started via ProcessStartInfo Verb="runas"). A declined UAC prompt (Win32Exception 1223) returns to the dialog with an accurate message; permissions are never bypassed.',
  },
  {
    area: "Enable",
    detail:
      'Calls SystemRestore.Enable("C:\\\\") (WMI root\\default:SystemRestore) for the system drive only; other drives, existing restore points and disk-usage settings are left untouched. Protection is never disabled by the app.',
  },
  {
    area: "Verify",
    detail:
      "Re-reads the protection status after enabling. Only a verified ON state continues to creation; otherwise the dialog shows the manual System Properties › System Protection steps.",
  },
  {
    area: "Create & verify",
    detail:
      "SystemRestore.CreateRestorePoint(name, APPLICATION_INSTALL=0, BEGIN_SYSTEM_CHANGE=100) then lists SystemRestore instances to confirm the new sequence number exists. Windows' 24-hour creation frequency limit (SystemRestorePointCreationFrequency) is reported as such, never as success.",
  },
];

export const LAYOUT_RULES: string[] = [
  "Dashboard order: Overall Optimization Score (left, 272–312px) and the Auto Optimize maintenance panel (remaining width) share the first row; then System Overview tiles, a single-row System Information strip, Quick Actions. Optimization Status is removed.",
  "The full telemetry chart lives only on System Telemetry. The Dashboard keeps compact sample tiles and a link to it.",
  "Hero panels (score, Auto Optimize, RAM Limiter, telemetry console, V4 primary action) are the only surfaces with hero glass; dense data panels stay solid.",
  "Phase areas that swap content (Auto Optimize body) keep a fixed 212px height so the page never jumps.",
  "V4 pages: main column + 320px status rail. Maximum Performance = scope → status → protection; Emulator Optimization = connection strip → three-engine pipeline → session rail. Neither shows a live log.",
  "Below 900px content width the V4 rail moves under the main column as a two-column grid; below 760px everything stacks.",
];

export const SLIDER_SPEC: string[] = [
  "Built on a native range input, so arrow keys, Page Up/Down, Home/End, touch drag and screen readers work without custom code.",
  "Track 8px with an inset shadow; the cyan → blue fill ends exactly under the thumb centre (thumb radius 10px). The fill updates instantly — no transition.",
  "Marks (min, recommended, intermediate, max) sit under the track using the same thumb-travel formula; the recommended mark is green.",
  "The numeric field and slider share one value. Valid typing updates live; blur or Enter clamps to min/max and snaps to the step; Esc reverts; arrow keys step.",
  "RAM Limiter: one shared, persisted configuration (src/lib/eo/ramLimiter.ts). AUTO/LIGHT/AGGRESSIVE calculate each background app's target from system RAM, memory pressure, category floor and focus; never above the current working set; foreground (when protected) and critical processes are never limited; Aggressive asks for confirmation. MANUAL: per-app target 128 MB–8 GB in MB or GB with Save / Cancel / Reset (default = current AUTO target). Enforcement is simulated; a native bridge would apply it.",
];

/** Auto Optimize — recurring maintenance engine (prototype behaviour = intended native behaviour). */
export const AUTO_OPTIMIZE_SPEC: { area: string; detail: string }[] = [
  {
    area: "Concept",
    detail:
      "A recurring maintenance engine that runs only the tasks the user selected, on a schedule. It is separate from the 1-Click Analyze → Review → Confirm workflow.",
  },
  {
    area: "Tasks",
    detail:
      "Grouped: Temporary files (Windows, current user, crash dumps) · Memory (Empty Standby List) · Browser cache (Chrome, Edge, Firefox — cache only) · Recycle Bin · System caches (DirectX shader cache, DNS). Fresh configuration selects only the SAFE recommended tasks; browser and Recycle Bin tasks start unselected.",
  },
  {
    area: "Schedule",
    detail:
      "Presets 1 / 5 / 10 / 30 / 60 minutes, plus Custom from 1 minute to 24 hours in whole minutes (minutes or hours unit). Zero, negative, empty and >24 h values are rejected inline and block Save.",
  },
  {
    area: "Status",
    detail:
      "Enabled · Paused · Running · Disabled · Suspended. Shows interval, next run time, live countdown, interval progress, last run, task count and profile. Pause holds the remaining time; Resume continues it.",
  },
  {
    area: "Overlap",
    detail:
      "Runs never overlap. Policy Skip: a due run is skipped and logged. Policy Queue: one run waits; further due runs are skipped.",
  },
  {
    area: "Unattended runs",
    detail:
      "Schedule, launch, exit and Windows-startup runs are unattended: LOW-risk tasks are skipped in safe-only mode, the Recycle Bin is skipped while “Ask before emptying” is on, and a running browser's cache is skipped — the browser is never closed.",
  },
  {
    area: "Results",
    detail:
      "Every selected task ends as Completed, Skipped (with reason), Cancelled or Not run. A run with any cancelled task is reported Cancelled, with skips Partial; success is never reported for unfinished work. Amounts shown are sample data.",
  },
  {
    area: "Configuration",
    detail:
      "Edits are a draft; Save & apply commits. The master switch and Pause / Resume apply immediately. Saving with a new interval restarts the countdown.",
  },
  {
    area: "Prototype limits",
    detail:
      "The schedule runs only while the browser tab is open. App close, Windows startup and shutdown are simulated events on the Auto Optimize page; a missed schedule while the tab was closed is logged honestly.",
  },
];

/** Future native (.NET 8 WPF) architecture — documented, not implemented in the prototype. */
export const NATIVE_AUTO_ARCHITECTURE: { area: string; detail: string }[] = [
  {
    area: "Background agent",
    detail:
      "A small per-user agent process (no admin service required for user-scope tasks) hosts the scheduler, started at sign-in via HKCU\\…\\Run or a Task Scheduler logon trigger when “Start with Windows” is on. The WPF UI talks to it over a named pipe.",
  },
  {
    area: "Persistent scheduling",
    detail:
      "Config (tasks, interval, policies) and LastRunUtc / NextRunUtc are stored as JSON in %LOCALAPPDATA%\\ErrorOptimizer. A PeriodicTimer computes NextRunUtc from LastRunUtc; on resume from sleep the agent re-evaluates rather than firing a backlog.",
  },
  {
    area: "Application close",
    detail:
      "Stop: the UI tells the agent to stop scheduling until next launch. Run once: the UI requests one exit run, then exits without waiting for it. Background: the agent keeps scheduling with the UI closed.",
  },
  {
    area: "Shutdown / restart",
    detail:
      "The agent listens for session-ending (WM_QUERYENDSESSION / SystemEvents.SessionEnding), cancels the active run via CancellationToken and never blocks or delays shutdown. Nothing runs while the PC is off; the schedule resumes after the next sign-in according to the startup policy.",
  },
  {
    area: "Task execution",
    detail:
      "One SemaphoreSlim(1) guards runs (no overlap). Each task is an IMaintenanceTask with a CancellationToken; locked files are skipped (IOException / UnauthorizedAccess), files are never force-unlocked, and browser tasks check for the browser process first and skip if it is running.",
  },
  {
    area: "Safe cleanup",
    detail:
      "Temp cleanup honours the age threshold; browser tasks delete only cache folders (never Cookies, Login Data, Web Data or History). Recycle Bin uses SHEmptyRecycleBin and requires explicit opt-out of confirmation for unattended runs.",
  },
  {
    area: "History & errors",
    detail:
      "Each run writes a history record (trigger, start/end, per-task outcome, bytes freed when measured, error message). Failures are shown verbatim; there is no simulated or fabricated output.",
  },
];
