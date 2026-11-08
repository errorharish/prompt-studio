// Contextual optimization guides — one registry for every help popover in the prototype.
// Content describes what each feature in the native WPF app is designed to do, in plain words,
// using only facts already stated on the matching page. No guide promises a speed-up: every
// prototype action is simulated and changes nothing on this PC (the popover says so).

export type GuideRisk = "info" | "low" | "medium" | "high";

export interface Guide {
  title: string;
  /** What the optimization does — one sentence. */
  what: string;
  /** Why it is useful. */
  why: string;
  /** How it works at a high level (shown under "How it works"). */
  how: string;
  /** When to use it. */
  when: string;
  /** Expected benefit — never a guaranteed number. */
  benefit: string;
  risk: GuideRisk;
  /** Important risks or limitations. */
  limits: string;
  /** What is protected and which compatibility conditions apply (page guides). */
  safety?: string;
  /** Restart requirement, when the question applies. */
  restart?: string;
  /** Reversibility, when the question applies. */
  reversible?: string;
  /** Optional technical points shown under "How it works". */
  details?: string[];
}

const VARIES = "Varies by hardware and workload; no specific gain is promised.";

export const GUIDES = {
  /* ───── Page guides (key = registry slug; the Dashboard "/" uses "dashboard") ───── */
  dashboard: {
    title: "Dashboard",
    what: "Overview of the optimization score, sample system readings and automatic maintenance, with shortcuts and Quick Optimize actions.",
    why: "One place to see the state of the PC and start the most common tasks.",
    how: "Navigation Shortcuts only open a page. Quick Optimize actions run in place, one at a time, and each runs only its own steps.",
    when: "Whenever you open the app, or for a quick cleanup without opening a full page.",
    benefit: "Common tasks are one click away; the score shows what still needs attention.",
    risk: "low",
    safety:
      "A second Quick Optimize action can't start while one is running. Create Restore Point checks System Protection first.",
    limits:
      "Readings and the score are illustrative sample values. Quick Optimize runs a fixed set of steps — use the full pages to choose items.",
    restart: "Not required",
    reversible: "No for cleanup — deleted temporary and cache files can't be brought back",
  },
  "one-click": {
    title: "1-Click Optimization",
    what: "Finds recommended optimizations for your PC and applies only the ones you keep selected.",
    why: "One guided pass replaces visiting many pages one by one.",
    how: "Analyze loads the recommendation list, Review shows exactly what is selected, and Confirm runs only those items. Protected apps, drivers and Windows components are never targets.",
    when: "First-time setup, or after a big Windows update.",
    benefit: `Less background workload and a tidier system. ${VARIES}`,
    risk: "low",
    limits:
      "Applicable items are pre-selected in the appropriate mode. Some items only take effect after a restart.",
    restart: "Only for items marked Requires Restart",
    reversible: "Yes — each change is recorded so it can be restored",
  },
  "auto-optimize": {
    title: "Auto Optimize",
    what: "Repeats the maintenance tasks you choose on a schedule.",
    why: "Temporary files and idle memory build up again over time; a schedule keeps them in check without you remembering.",
    how: "Pick tasks and an interval. Each run does the tasks one at a time; if a run is still going when the next is due, the overlap rule decides what happens.",
    when: "After you've set up your PC and only want light upkeep.",
    benefit: "Keeps disk space and standby memory tidy between manual cleanups.",
    safety:
      "Browser cleanup removes cache only — never passwords, cookies, logins or history. Emptying the Recycle Bin is off by default and asks first.",
    risk: "low",
    limits:
      "Browser cleanup removes cache only — never passwords, cookies, logins or history. Emptying the Recycle Bin is permanent, so it is off by default and asks first.",
    restart: "Not required",
    reversible:
      "Settings yes; deleted temporary files and emptied Recycle Bin items cannot be brought back",
  },
  "input-optimizer": {
    title: "Input Optimizer",
    what: "Tunes pointer precision, keyboard repeat rate and timer settings.",
    why: "Consistent pointer and key response matters most in fast games.",
    how: "Normal presets change standard Windows pointer and keyboard settings. Advanced items change input queue, timer and USB settings.",
    when: "If aiming feels inconsistent or key repeat feels slow.",
    benefit: `More consistent input feel. ${VARIES}`,
    safety:
      "Normal and Advanced include applicable, recommended items — not-applicable and already-applied items are left out. Only Custom lets you choose items yourself.",
    risk: "low",
    limits:
      "Pointer precision changes how the mouse feels; you may need to re-adjust sensitivity in games.",
    restart: "Some advanced items need a sign-out or restart",
    reversible: "Yes — previous values are backed up",
  },
  "registry-tweak": {
    title: "Registry Intelligence",
    what: "Applies grouped registry changes for CPU scheduling, gaming, memory and privacy.",
    why: "Several Windows behaviours can only be changed in the registry.",
    how: "Each change is checked against your hardware, the current value is backed up, then the new value is written and read back.",
    when: "After the Normal profile, if you want finer control.",
    benefit: `Small scheduling and responsiveness improvements on some systems. ${VARIES}`,
    safety:
      "Each change is checked against your hardware first, with safety confirmation on every run.",
    risk: "medium",
    limits: "Wrong registry values can cause instability.",
    restart: "Many registry changes need a restart",
    reversible: "Yes — the original value is backed up first",
  },
  "registry-values": {
    title: "Registry Values",
    what: "Overview of every RAM and GPU registry value the optimizer supports, with the value it would set for your hardware.",
    why: "These values depend on your RAM size, CPU and graphics card, so each one is matched to the detected hardware.",
    how: "Each row shows the target value above the current one. Click a row for the registry path, type and why it applies.",
    when: "When you want to see what would change before opening the RAM or GPU page.",
    benefit: "Values matched to your hardware instead of one-size-fits-all.",
    safety:
      "Values that don't fit your hardware or profile are marked N/A. Diagnostic values are reference only and never applied.",
    risk: "info",
    limits: "This page only shows values; applying happens on the RAM and GPU pages.",
  },
  "registry-values-ram": {
    title: "RAM Registry Values",
    what: "Sets the Service Host split threshold to match your installed RAM.",
    why: "It controls how many Windows services share one process.",
    how: "Choose your RAM size; the matching threshold is written to SvcHostSplitThresholdInKB.",
    when: "After adding or removing RAM, or to match the value to your system.",
    benefit: "Fewer separate service processes on systems with more RAM.",
    safety:
      "The value comes from the original app's fixed table of RAM sizes (4–128 GB); only this one value changes.",
    risk: "low",
    limits:
      "Grouping services means one failing service can affect the others in its group. Task Manager will show fewer processes, which is expected.",
    restart: "Required",
    reversible: "Yes — restore the previous value",
  },
  "gpu-registry-values": {
    title: "GPU Registry Values",
    what: "Applies graphics registry settings grouped by GPU feature.",
    why: "Some graphics behaviours, like scheduling, are only exposed in the registry.",
    how: "Pick the groups you want; each change is verified by reading it back.",
    when: "When you have a supported GPU and want to review its scheduling options.",
    benefit: `Possible smoother frame delivery on supported cards. ${VARIES}`,
    safety:
      "Each group is checked against your GPU and driver before it is offered, and unsupported groups are hidden.",
    risk: "medium",
    limits: "A driver update can reset these values.",
    restart: "Required for scheduling changes",
    reversible: "Yes",
  },
  "startup-manager": {
    title: "Startup Manager",
    what: "Turns startup apps and background tasks on or off.",
    why: "Fewer apps launching at sign-in means a quicker, lighter start.",
    how: "Each entry shows its boot impact. Turning one off stops it starting automatically; the app itself stays installed.",
    when: "When sign-in feels slow or the system tray is crowded.",
    benefit: "Faster sign-in and less background activity.",
    safety: "System entries ask for confirmation. Turning an entry off never uninstalls the app.",
    risk: "low",
    limits: "Apps you turn off won't auto-start until you turn them back on.",
    restart: "Takes effect at next sign-in",
    reversible: "Yes — switch the entry back on",
  },
  "service-manager": {
    title: "Service Manager",
    what: "Shows Windows background services and lets you change how they start.",
    why: "Services you never use still take memory and CPU time.",
    how: "Each service shows its startup mode and a safety rating; you choose the new startup mode.",
    when: "When you know which features you don't use, such as printing or Xbox services.",
    benefit: "Less background memory and CPU use.",
    safety:
      "Protected services cannot be changed, and important services ask for explicit confirmation.",
    risk: "medium",
    limits: "Disabling the wrong service can break a Windows feature.",
    restart: "Some services need a restart",
    reversible: "Yes — set the startup mode back",
  },
  "process-reduction": {
    title: "Process Intelligence",
    what: "Ends selected background processes to free memory.",
    why: "Idle helper apps hold memory you could use for a game or project.",
    how: "Each running process gets a safety rating; you pick which of the safe ones to end.",
    when: "Right before a game or heavy task.",
    benefit: "More free memory for the app you're using.",
    safety:
      "Only processes rated Safe to Terminate can be selected. System and protected processes are locked.",
    risk: "low",
    limits: "Ended apps may restart on their own. Save your work in any app first.",
    restart: "Not required",
    reversible: "Processes can be started again normally",
  },
  network: {
    title: "Network Boost",
    what: "Adjusts the Windows network stack for lower latency.",
    why: "Default network settings favour throughput over quick response.",
    how: "Persistent targets are applied and read back. One-time actions such as flushing DNS run once.",
    when: "For online gaming or calls, or after network problems.",
    benefit: `Possibly lower and steadier latency. ${VARIES}`,
    safety: "Persistent targets are backed up before they change.",
    risk: "low",
    limits:
      "It cannot fix your internet provider or Wi-Fi signal. Some actions reset the connection for a moment.",
    restart: "Some adapter changes need a restart",
    reversible: "Persistent targets yes; one-time actions have nothing to undo",
  },
  storage: {
    title: "Storage Optimizer",
    what: "Finds temporary files, caches and large files, then cleans the ones you pick.",
    why: "Junk files take space and slow down searches and backups.",
    how: "A scan groups files by type, then only the groups you keep selected are cleaned.",
    when: "When the drive is getting full.",
    benefit: "More free disk space.",
    safety:
      "Safe cleanup items are pre-selected; your own large files never are. Files in use are skipped.",
    risk: "low",
    limits: "Deleted files cannot be restored.",
    restart: "Not required",
    reversible: "No — cleaned files are permanently removed",
  },
  tools: {
    title: "System Tools",
    what: "Runs Windows diagnostics, repair and cleanup tools from one place.",
    why: "Saves finding each built-in Windows tool yourself.",
    how: "Each tool runs a standard Windows utility, such as a system file check, and logs the result below.",
    when: "When something is broken, or for routine checks.",
    benefit: "Quick access to repairs Windows already includes.",
    safety: "Diagnostics only read and report; repairs use Windows' own built-in utilities.",
    risk: "low",
    limits: "Repair tools can take several minutes. They fix Windows files, not hardware faults.",
    restart: "Some repairs ask for a restart",
    reversible: "Diagnostics change nothing; repairs restore Windows' own files",
  },
  normal: {
    title: "Normal Optimization",
    what: "Safe everyday changes: turns off non-essential telemetry, retail and background services.",
    why: "Good starting point with the lowest risk.",
    how: "Each target is checked against your hardware and its dependencies before it is offered.",
    when: "On any PC, as the first profile to apply.",
    benefit: "Fewer background services and processes.",
    safety:
      "Each target is checked against your hardware and its dependencies before it is offered.",
    risk: "low",
    limits: "Items already applied or not applicable are skipped.",
    restart: "Recommended after applying",
    reversible: "Yes — use Backup & Restore",
  },
  pro: {
    title: "Pro Optimization",
    what: "Builds on Normal with deeper service, registry and scheduled task changes.",
    why: "For power users who want more than the safe defaults.",
    how: "Applies Normal first, then extra hardware-checked targets.",
    when: "After Normal, if you understand which features you use.",
    benefit: "Further reduction of background workload.",
    safety: "Targets are hardware-checked, with confirmation on sensitive operations.",
    risk: "medium",
    limits: "Some Windows features you rarely use may stop working until restored.",
    restart: "Required",
    reversible: "Yes — use Backup & Restore",
  },
  ultimate: {
    title: "Ultimate Optimization",
    what: "Builds on Pro with more services, Windows features, scheduled tasks and visual effects.",
    why: "For dedicated gaming or work machines.",
    how: "Applies Pro, then the deepest set of targets.",
    when: "Only on a PC used for a few specific tasks.",
    benefit: "The smallest background footprint of the V3 profiles.",
    safety: "Deep system targets with explicit review and backup confirmation.",
    risk: "high",
    limits: "More Windows features may be turned off. Make sure a restore point exists first.",
    restart: "Required",
    reversible: "Yes — use Backup & Restore",
  },
  debloat: {
    title: "Debloat",
    what: "Removes telemetry, diagnostic tracking and pre-installed Windows apps.",
    why: "Pre-installed apps and tracking run in the background without being used.",
    how: "Uses a blocklist you can customize; the apps on it are removed.",
    when: "On a fresh Windows install or a PC with many unused apps.",
    benefit: "Fewer background apps and less tracking.",
    safety: "You decide what is on the blocklist, and apps are removed for the current user only.",
    risk: "medium",
    limits: "Removed apps must be reinstalled from the Microsoft Store if you want them back.",
    restart: "Recommended",
    reversible: "Settings yes; removed apps need reinstalling",
  },
  "bios-safe": {
    title: "BIOS Safe",
    what: "Reviews firmware-related settings and lists manual UEFI changes.",
    why: "Some performance settings live in firmware, not Windows.",
    how: "Windows-side items can be applied. Firmware items are only explained — you change them yourself in UEFI setup.",
    when: "When building or tuning a desktop PC.",
    benefit: "Clear guidance on firmware settings that Windows can't change.",
    safety: "It never writes to firmware — firmware items are only explained.",
    risk: "low",
    limits: "Wrong UEFI settings can stop a PC booting.",
    restart: "Firmware changes require entering UEFI setup",
    reversible: "Windows items yes; UEFI changes are undone in UEFI setup",
  },
  "max-performance": {
    title: "Maximum Performance (V3)",
    what: "Combines Ultimate with CPU, GPU scheduling, power, memory, storage and visual-effect changes.",
    why: "One profile for the fastest settings on a gaming or rendering PC.",
    how: "Applies Ultimate, then machine-specific performance targets.",
    when: "For dedicated gaming or rendering, on a desktop with good cooling.",
    benefit: `Highest performance focus of the V3 profiles. ${VARIES}`,
    safety: "Targets are matched to this machine with safety confirmation on every run.",
    risk: "high",
    limits: "Uses more power and heat. Not ideal for laptops on battery.",
    restart: "Required",
    reversible: "Yes — use Backup & Restore",
  },
  "ai-optimization": {
    title: "AI Optimization",
    what: "Sets per-app RAM limits, automatic per-app workload optimization and power plan recommendations.",
    why: "Stops one app using too much memory and matches power settings to what you're doing.",
    how: "Choose an app and a limit; the limit is watched while the app runs.",
    when: "When a browser or launcher grows large in the background.",
    benefit: "More memory left for your main app.",
    safety:
      "An app that goes over its limit is never closed — its memory is moved to standby instead. Changes need your confirmation.",
    risk: "low",
    limits: "Limits that are too low can make an app slower.",
    restart: "Not required",
    reversible: "Yes — remove the limit or switch power plan",
  },
  "backup-restore": {
    title: "Backup & Restore",
    what: "Keeps a record of every change and lets you undo it.",
    why: "Any optimization can be rolled back if something doesn't work for you.",
    how: "Before each change, the old value is saved as a transaction. Restore writes that value back.",
    when: "Before big profiles, or if something stops working after optimizing.",
    benefit: "A safe way back.",
    safety:
      "A restore point is only created after System Protection on C: has been checked — and, if it was off, turned on with your confirmation and verified.",
    risk: "info",
    limits: "Deleted files and removed apps are not stored here.",
    restart: "Restoring some items needs a restart",
    reversible: "This is the undo feature",
  },
  "performance-tuning": {
    title: "Performance Tuning",
    what: "Optional CPU and GPU tuning, only on hardware that supports safe controls.",
    why: "Some hardware has headroom that standard settings don't use.",
    how: "Checks support, measures a baseline, applies one change, checks stability and temperature, and keeps it only if it helps.",
    when: "On supported desktop hardware with good cooling.",
    benefit: `Possibly better sustained performance. ${VARIES}`,
    risk: "medium",
    limits: "Not overclocking past verified limits. Higher clocks mean more heat and power.",
    restart: "Not usually",
    reversible: "Yes — Revert to stock",
  },
  "v4-max-performance": {
    title: "Maximum Performance (V4)",
    what: "Reduces background CPU contention and balances process priorities on Windows.",
    why: "Fewer interruptions for the game or app in front of you.",
    how: "Pick the areas to tune; each change is recorded in a rollback journal before it runs.",
    when: "Before gaming, editing or streaming sessions.",
    benefit: `Less background contention. ${VARIES}`,
    risk: "low",
    limits:
      "Windows core files, display and audio drivers, network controllers and your active apps are never touched.",
    restart: "Not required",
    reversible: "Yes — Restore all",
  },
  "emulator-optimization": {
    title: "Emulator Optimization",
    what: "Picks an MSI App Player 5 profile and tunes host scheduling for the emulator (Engine 1).",
    why: "Emulators share the PC with Windows; tuning both sides helps games run more steadily.",
    how: "Run Maximum Performance first, connect the emulator, choose a profile, review the planned optimizations, then apply. Debloater and Advanced Optimization follow on their own pages.",
    when: "When you play Android games in MSI App Player 5.",
    benefit: `Steadier emulator performance. ${VARIES}`,
    risk: "low",
    limits:
      "Engines 2 and 3 need MSI App Player running with ADB turned on. Config files are never edited.",
    restart: "Restart the emulator after applying",
    reversible: "Yes — per engine or Restore all",
  },
  "v4.core": {
    title: "Core footprint convergence",
    what: "Repeatedly trims safe background processes until the footprint stops shrinking.",
    why: "Some background apps restart; repeated passes catch them.",
    how: "Each pass reduces background work; passes stop once the footprint stops shrinking.",
    when: "Before a long game or render.",
    benefit: "A smaller background footprint.",
    safety: "Windows and your active workload are never touched.",
    risk: "low",
    limits: "Apps that are needed will restart on their own.",
    restart: "Not required",
    reversible: "Processes start again normally",
  },
  "emulator-debloater": {
    title: "Emulator Debloater",
    what: "Scans the emulator and turns off unneeded Android packages, services and background components.",
    why: "Fewer guest apps means more resources for the game.",
    how: "Scan, review the classified list (safe, recommended, protected, not applicable, requires confirmation), preview, then confirm. Verify and Restore are available afterwards.",
    when: "After connecting the emulator, or when setting up a new instance.",
    benefit: "A leaner emulator.",
    safety: "Essential Android components are protected, and components are disabled, not deleted.",
    risk: "medium",
    limits: "Disabling a needed app can break a feature.",
    restart: "Restart the emulator",
    reversible: "Yes — disabled components can be enabled again",
  },
  "emulator-advanced": {
    title: "Emulator Advanced Optimization",
    what: "Advanced guest tuning in categories: graphics & rendering, memory, frame pacing and background resources, with a low-end hardware profile.",
    why: "Weak hardware benefits most from lighter emulator rendering and memory use.",
    how: "Choose a hardware profile, review each category, then apply. Adjusts compositor (SurfaceFlinger), HWUI and guest memory (Dalvik) settings over ADB.",
    when: "After Emulator Optimization, or on low-spec PCs running an emulator.",
    benefit: `Steadier frame pacing on weak hardware. ${VARIES}`,
    risk: "low",
    limits: "Needs an ADB connection. Advanced risky tweaks are off by default.",
    restart: "Restart the emulator",
    reversible: "Yes — Restore",
  },

  /* ───── Section guides ───── */
  "dashboard.score": {
    title: "Overall Optimization Score",
    what: "A weighted summary of performance, responsiveness, memory and efficiency.",
    why: "One number to see how optimized the system looks at a glance.",
    how: "Each category gets a 0–100 value and a weight; the overall score is the weighted average. 85 or more is good, 70–84 is fair.",
    when: "Check it before and after optimizing.",
    benefit: "Shows which area to look at first.",
    risk: "info",
    limits: "In this prototype the values are sample data and a run never changes the score.",
  },
  "dashboard.shortcuts": {
    title: "Navigation shortcuts",
    what: "Jump straight to One-Click, Maximum Performance, Startup Manager or System Telemetry.",
    why: "The pages you open most, one click away.",
    how: "Each shortcut only opens its page. Nothing runs until you start it there.",
    when: "Whenever you want the full page with its review steps.",
    benefit: "Faster navigation.",
    risk: "info",
    limits: "Shortcuts never apply changes by themselves.",
  },
  "dashboard.quick-actions": {
    title: "Quick Optimize",
    what: "Run one routine task straight from the Dashboard.",
    why: "No need to open a page for everyday upkeep.",
    how: "Each card runs only its own task, step by step, with a progress window. Only one runs at a time, and you stay on the Dashboard.",
    when: "For quick, routine upkeep.",
    benefit: "Fast access to everyday tasks.",
    risk: "low",
    limits:
      "Files in use, running apps and open browsers are skipped. Browser cleanup is cache only.",
    restart: "Not required",
  },
  "backup.restore-point": {
    title: "System Protection & restore points",
    what: "Windows restore points need System Protection turned on for the system drive.",
    why: "A restore point lets you roll Windows settings back if something goes wrong.",
    how: "The status is checked first. If protection is off, you're asked whether to turn it on for C: only; Windows asks for administrator permission, the setting is read back, and only then is the restore point created and checked.",
    when: "Before larger optimizations.",
    benefit: "A safe way back.",
    risk: "low",
    limits:
      "Protection uses some disk space on C:. A policy set by an administrator can block it; you then get manual steps. In this prototype the device state is simulated.",
    reversible: "Yes — protection can be turned off again in System Properties",
  },
  "input.modes": {
    title: "Optimization modes",
    what: "Normal, Advanced or Custom input optimization.",
    why: "Pick how far to go without judging every setting yourself.",
    how: "Normal and Advanced select every applicable, recommended item for you. Custom is the only mode where you pick items, and it is saved separately.",
    when: "Start with Normal; try Advanced for competitive gaming.",
    benefit: `Recommended settings without guesswork. ${VARIES}`,
    risk: "low",
    limits: "Not applicable and already-applied items are never pre-selected.",
    restart: "Some advanced items need a restart",
    reversible: "Yes",
  },
  "telemetry.health": {
    title: "System Health Check",
    what: "Scores CPU, memory, GPU, storage and responsiveness from their readings.",
    why: "Shows which area needs attention first.",
    how: "Each reading gets a 0–100 score; a category takes its worst reading; the overall score is the weighted average of the measured categories. Missing readings are left out and shown as coverage, never counted as perfect.",
    when: "After hardware changes or when the PC feels slow.",
    benefit: "A repeatable summary of system condition.",
    risk: "info",
    limits:
      "High load is resource use, not hardware damage. In this prototype every value is sample data; the same data always gives the same score.",
  },
  "dashboard.auto": {
    title: "Auto Optimize panel",
    what: "Shows the maintenance schedule and lets you turn it on or off.",
    why: "See when maintenance last ran and when it runs next.",
    how: "Uses the same schedule as the Auto Optimize page; changes here and there stay in sync.",
    when: "Any time you want to pause or resume upkeep.",
    benefit: "Control the schedule without leaving the Dashboard.",
    risk: "info",
    limits: "To change tasks or the interval, open Auto Optimize.",
  },
  "auto.tasks": {
    title: "Maintenance tasks",
    what: "The cleanup jobs each scheduled run performs.",
    why: "Choose only what you want done automatically.",
    how: "Tasks run in order. Files in use are skipped, never forced.",
    when: "Set once, then adjust if needed.",
    benefit: "Disk space and memory stay tidy.",
    risk: "low",
    limits:
      "Browser cleanup is cache only. Emptying the Recycle Bin is permanent and off by default.",
    reversible: "Deleted files cannot be restored",
  },
  "auto.schedule": {
    title: "Schedule",
    what: "How often the selected tasks run.",
    why: "Frequent runs keep things tidy; rare runs use fewer resources.",
    how: "Choose 1, 5, 10, 30 or 60 minutes, or a custom interval up to 24 hours.",
    when: "Use a longer interval on slower PCs.",
    benefit: "Upkeep that matches how you use the PC.",
    risk: "info",
    limits: "Very short intervals give little extra benefit.",
  },
  "input.normal": {
    title: "Normal input optimization",
    what: "Standard pointer and keyboard presets.",
    why: "Changes Windows' default mouse acceleration and key repeat.",
    how: "Writes standard Windows input settings after saving the old values.",
    when: "On any PC.",
    benefit: "More predictable mouse and keyboard response.",
    risk: "low",
    limits: "Mouse sensitivity may feel different afterwards.",
    restart: "Not required",
    reversible: "Yes",
  },
  "input.advanced": {
    title: "Advanced input optimization",
    what: "Input queue, timer and USB settings.",
    why: "Targets input delay inside Windows.",
    how: "Adjusts input queue sizes, timer resolution requests and USB power settings.",
    when: "For competitive gaming, after trying Normal.",
    benefit: `Possibly lower input delay. ${VARIES}`,
    risk: "medium",
    limits: "Can raise power use. Requires explicit confirmation before applying.",
    restart: "Some items need a restart",
    reversible: "Yes",
  },
  "input.test": {
    title: "Input test",
    what: "A before/after check of input timing.",
    why: "Shows whether a change made a difference for your setup.",
    how: "The native app records pointer timing for a few seconds before and after.",
    when: "After applying input changes.",
    benefit: "Evidence instead of guesswork.",
    risk: "info",
    limits: "This prototype shows sample states only; no input is measured.",
  },
  "registry.recommended": {
    title: "Recommended registry changes",
    what: "Registry changes that match your hardware and are low risk.",
    why: "A safe subset so you don't have to judge each value.",
    how: "Each item is backed up, written, then read back to confirm.",
    when: "Start here before choosing individual items.",
    benefit: "Hardware-matched defaults.",
    risk: "low",
    limits: "Not applicable and already-applied items are never pre-selected.",
    restart: "Usually required",
    reversible: "Yes",
  },
  "registry.ram-values": {
    title: "RAM registry values",
    what: "Memory, scheduling and network values whose best setting depends on installed RAM, CPU threads and machine type.",
    why: "A value that suits a 64 GB desktop can be wrong for an 8 GB laptop.",
    how: "Each target is calculated from the hardware, for example the Service Host threshold from the nearest RAM tier.",
    when: "After changing RAM or moving to a different machine.",
    benefit: "Settings sized to your memory and CPU.",
    risk: "medium",
    limits: "Some values only take effect after a restart; results vary by system.",
    restart: "Required for Service Host and I/O buffer values",
    reversible: "Yes — the previous value is backed up first",
  },
  "ram.size": {
    title: "RAM size",
    what: "Picks the Service Host split threshold for your installed memory.",
    why: "The right value depends on how much RAM you have.",
    how: "Select the size; the matching value is shown before anything is written.",
    when: "Choose the size that matches your installed RAM.",
    benefit: "A value suited to your memory.",
    risk: "low",
    limits: "Choosing a size larger than installed RAM has no benefit.",
    restart: "Required",
    reversible: "Yes",
  },
  "gpu.groups": {
    title: "Hardware-aware GPU groups",
    what: "GPU settings grouped by feature, shown only when your card supports them.",
    why: "Avoids changes that don't apply to your graphics card.",
    how: "Your GPU and driver are checked before a group is offered.",
    when: "After a driver install.",
    benefit: "Only relevant GPU options.",
    risk: "medium",
    limits: "A driver update can reset values.",
    restart: "Required for scheduling changes",
    reversible: "Yes",
  },
  "network.targets": {
    title: "Persistent network targets",
    what: "Network settings that stay changed until you restore them.",
    why: "Lasting latency-focused settings for gaming and calls.",
    how: "Backup, apply, then read back to confirm each value.",
    when: "On a stable wired or Wi-Fi connection.",
    benefit: `Possibly lower latency. ${VARIES}`,
    risk: "low",
    limits: "Some adapters ignore certain settings.",
    restart: "Some need a restart",
    reversible: "Yes",
  },
  "network.actions": {
    title: "One-time network actions",
    what: "Maintenance like flushing DNS or resetting network caches.",
    why: "Fixes stale addresses and some connection problems.",
    how: "Each action runs once and doesn't change lasting settings.",
    when: "When websites fail to load or after changing networks.",
    benefit: "Clears common network glitches.",
    risk: "low",
    limits: "The connection may drop for a moment.",
    restart: "Network reset needs a restart",
    reversible: "Nothing to undo",
  },
  "storage.clean": {
    title: "Deep clean",
    what: "Removes temporary files, caches and leftovers Windows no longer needs.",
    why: "Frees space safely.",
    how: "Applicable items are pre-selected; files in use are skipped.",
    when: "Whenever free space is low.",
    benefit: "More free disk space.",
    risk: "low",
    limits: "Cleaned files cannot be restored.",
    restart: "Not required",
    reversible: "No",
  },
  "storage.recycle": {
    title: "Recycle Bin",
    what: "Permanently deletes everything already in the Recycle Bin.",
    why: "Items in the bin still use disk space.",
    how: "Asks for confirmation, then empties the bin.",
    when: "After checking nothing in the bin is needed.",
    benefit: "Frees the space those items use.",
    risk: "medium",
    limits: "Permanent — items cannot be recovered.",
    reversible: "No",
  },
  "storage.explorer": {
    title: "File explorer",
    what: "Browse large files and folders to decide what to remove.",
    why: "Large personal files are often the biggest space users.",
    how: "Lists files by size. Your personal files are never selected for you.",
    when: "When cleanup alone doesn't free enough space.",
    benefit: "Find what is filling the drive.",
    risk: "medium",
    limits: "Deleting personal files is permanent; check before removing.",
    reversible: "No",
  },
  "tier.preview": {
    title: "What will change",
    what: "The exact list of items this profile would apply.",
    why: "See and adjust every change before it runs.",
    how: "Eligible items are pre-selected. Protected, applied and not-applicable items are not.",
    when: "Always review before applying.",
    benefit: "No surprises.",
    risk: "info",
    limits: "Untick anything you're unsure about.",
  },
  "tier.debloat": {
    title: "Debloat toolbox",
    what: "Removes pre-installed apps on the blocklist and turns off tracking.",
    why: "Unused apps and tracking use background resources.",
    how: "Customize the blocklist, then apply.",
    when: "On a fresh install or a PC with many unused apps.",
    benefit: "Fewer background apps.",
    risk: "medium",
    limits: "Removed apps must be reinstalled from the Microsoft Store.",
    reversible: "Settings yes; apps need reinstalling",
  },
  "tier.uefi": {
    title: "Manual UEFI changes",
    what: "Firmware settings you change yourself in UEFI setup.",
    why: "Windows cannot change firmware safely.",
    how: "Each item explains the setting; you change it in UEFI setup.",
    when: "When you're comfortable in UEFI setup.",
    benefit: "Clear firmware guidance.",
    risk: "medium",
    limits: "Wrong UEFI settings can stop the PC booting. Note the old value first.",
    restart: "You must restart into UEFI setup",
    reversible: "Change the setting back in UEFI",
  },
  "ai.ram-limiter": {
    title: "RAM Limiter",
    what: "Caps how much memory a chosen app can hold.",
    why: "Keeps a background app from taking memory your main app needs.",
    how: "Pages above the limit are moved to standby; the app is never closed. Auto, Light and Aggressive calculate a target per app; Manual sets one app at a time (128 MB–8 GB).",
    when: "For browsers or launchers that grow large while you game.",
    benefit: "More memory available for your active app.",
    risk: "low",
    limits: "A limit that is too low can make the limited app slower.",
    restart: "Not required",
    reversible: "Yes — remove the limit",
  },
  "ai.power": {
    title: "Power plans",
    what: "Recommends or creates a Windows power plan for your workload.",
    why: "Power plans trade energy use for performance.",
    how: "Pick a plan, or create a custom one based on an existing plan.",
    when: "Use high performance plans when plugged in.",
    benefit: "Performance matched to the task.",
    risk: "low",
    limits: "High performance plans use more power and heat.",
    restart: "Not required",
    reversible: "Yes — switch back to your old plan",
  },
  "settings.safety": {
    title: "Safety guardrails",
    what: "Rules that protect your system during any optimization.",
    why: "Keeps backups and confirmations on by default.",
    how: "Changes are recorded before they run; risky actions ask first.",
    when: "Keep these on unless you have a specific reason.",
    benefit: "A reliable way to undo changes.",
    risk: "info",
    limits: "Turning guardrails off removes that safety net.",
  },
  "v4.scope": {
    title: "Optimization areas",
    what: "Choose which host areas Maximum Performance tunes.",
    why: "Tune only what fits your workload.",
    how: "Every area is pre-selected; untick any you want to keep as is. The review lists only what you picked.",
    when: "Before running Maximum Performance.",
    benefit: "Control over what changes.",
    risk: "low",
    limits: "Protected Windows components are never included.",
  },
  "emu.engines": {
    title: "Engine pipeline",
    what: "Three engines applied in order: scheduling, guest debloat and graphics.",
    why: "Each step builds on the one before.",
    how: "Engine 1 tunes host scheduling. Engines 2 and 3 work inside the emulator over ADB.",
    when: "Apply in order, after connecting ADB.",
    benefit: `Steadier emulator performance. ${VARIES}`,
    risk: "low",
    limits: "Engines 2 and 3 are unavailable without ADB.",
    restart: "Restart the emulator",
    reversible: "Yes — per engine",
  },
  "hub.debloater": {
    title: "Deep Debloater",
    what: "Lists Android packages, services and telemetry in the emulator and disables the ones you pick.",
    why: "Unused guest apps take memory and CPU.",
    how: "Scan first; safe items are pre-selected and protected ones are locked. Packages are disabled, not deleted.",
    when: "After a fresh emulator install.",
    benefit: "A lighter emulator.",
    risk: "medium",
    limits: "Disabling a needed app can break a feature.",
    restart: "Restart the emulator",
    reversible: "Yes — re-enable packages",
  },
  "hub.lowend": {
    title: "Low-End Extreme",
    what: "Strong emulator tuning for weak hardware.",
    why: "Low-spec PCs need lighter rendering and memory use.",
    how: "Applies conservative rendering and memory changes; risky tweaks need a separate switch.",
    when: "On dual-core or integrated graphics PCs.",
    benefit: "Better playability on weak hardware.",
    risk: "medium",
    limits: "Visual quality may be reduced.",
    restart: "Restart the emulator",
    reversible: "Yes",
  },
} satisfies Record<string, Guide>;

export type GuideId = keyof typeof GUIDES;

/** Registry pages without an optimization purpose (telemetry, settings, info, V4 launcher). */
export const NO_PAGE_GUIDE = ["system-info", "settings", "about", "v4-dashboard"] as const;

/** The Dashboard lives at "/" (empty slug). */
const PAGE_GUIDE_ALIAS: Record<string, GuideId> = { "": "dashboard" };

export function pageGuide(slug: string): GuideId | null {
  if (slug in PAGE_GUIDE_ALIAS) return PAGE_GUIDE_ALIAS[slug] ?? null;
  return slug in GUIDES && !slug.includes(".") && slug !== "dashboard" ? (slug as GuideId) : null;
}

/* ───── Full page guides (the GUIDE button dialog) ─────
 * Every page uses the same dialog: title, subtitle, numbered sections, Got it.
 * Pages that already had a written V3/V4 guide keep it word for word (PRESERVED);
 * every other page builds its sections from its guide record, in this fixed order,
 * skipping sections the record has nothing for. */

export interface GuideStep {
  title: string;
  text: string;
  /** Small label beside the section title (e.g. engine name, risk level). */
  tag?: string;
  /** Optional technical points. */
  points?: readonly string[];
}

export interface StepGuide {
  title: string;
  sub: string;
  steps: readonly GuideStep[];
  note?: string;
}

export const GUIDE_SECTION_TITLES = [
  "What This Feature Does",
  "How It Works",
  "Expected Benefits",
  "Safety & Compatibility",
  "When to Use It",
  "Risks & Limitations",
  "Reversibility",
] as const;

const steps = (rows: readonly (readonly [string, string, string?])[]): GuideStep[] =>
  rows.map(([title, text, tag]) => (tag ? { title, text, tag } : { title, text }));

/** Guides written for the original V3/V4 dialogs — kept verbatim. */
export const PRESERVED_STEP_GUIDES: Partial<Record<GuideId, StepGuide>> = {
  "one-click": {
    title: "How 1-Click Optimization works",
    sub: "Optimize your PC safely in a few simple steps.",
    steps: steps([
      ["CHECK", "ERROR OPTIMIZER scans your PC and finds relevant optimization opportunities."],
      [
        "REVIEW",
        "You can see what can be improved, why it was selected, and which apps are protected.",
      ],
      [
        "CHOOSE",
        "Keep the recommended changes or customize the selection for your specific needs.",
      ],
      [
        "OPTIMIZE",
        "ERROR OPTIMIZER applies only the selected safe changes. System files, drivers and active apps are protected.",
      ],
      [
        "VERIFY",
        "Every applied change is checked. If a change cannot be safely verified it is rolled back.",
      ],
    ]),
    note: "Protected apps, drivers and critical Windows components are never treated as targets.",
  },
  "performance-tuning": {
    title: "How Performance Tuning works",
    sub: "ERROR OPTIMIZER only uses safe hardware controls supported by your CPU and GPU.",
    steps: steps([
      ["CHECK", "Checks whether your CPU or GPU supports safe tuning controls."],
      ["TEST", "Measures your current baseline performance and temperature."],
      ["TUNE", "Applies one controlled change."],
      ["VERIFY", "Checks stability, temperature and real performance."],
      [
        "DECIDE",
        "Keeps the change only if it improves stable performance. Otherwise it is reverted.",
      ],
    ]),
    note: "In this prototype nothing is measured or tuned.",
  },
  "v4-max-performance": {
    title: "Maximum Performance guide",
    sub: "Safe, non-destructive Windows performance optimization.",
    steps: steps([
      [
        "What Maximum Performance optimizes",
        "Reduces background CPU contention, releases idle process working sets, and balances priorities.",
      ],
      [
        "What remains safeguarded",
        "Core Windows OS binaries, display drivers, audio engines, network controllers and your active apps are never touched.",
      ],
      [
        "Reversibility via local rollback journal",
        "Every applied modification is recorded in a transactional journal before execution.",
      ],
      [
        "Built for gaming, editing, streaming & daily use",
        "Designed for workload-specific review; no compatibility or performance tests run in this prototype.",
      ],
    ]),
  },
  "emulator-optimization": {
    title: "Error Optimizer V4 — Architecture & optimization guide",
    sub: "Technical reference for host & guest optimization engines",
    steps: steps([
      [
        "Getting Started",
        "Recommended sequence: 1) Host Maximum Performance, 2) Launch MSI App Player 5 & verify ADB, 3) Engine 1, 4) Engine 2, 5) Engine 3.",
        "Architecture & sequence",
      ],
      [
        "Maximum Performance",
        "Transforms the Windows host: MMCSS scheduling, 0.5 ms timer clamp, safe process intelligence with zero arbitrary killing, accurate process counting.",
        "Host Windows tuning suite",
      ],
      [
        "Emulator Optimization",
        "Host process elevation (HD-Player.exe), frame-rate unlock and pre-launch vs live modes.",
        "Engine 1: MMCSS & 240Hz cap",
      ],
      [
        "Deep Debloater",
        "Authentic guest discovery via ADB, ironclad essential component protection, safe disabling instead of deleting APKs.",
        "Engine 2: Real ADB inventory",
      ],
      [
        "Advanced Optimization",
        "Latch-unsignaled rendering, HWUI render pipeline tuning and Dalvik heap compaction. Never edits emulator config files.",
        "Engine 3: SurfaceFlinger & Dalvik",
      ],
      [
        "MSI & ADB Setup",
        "Open MSI App Player Settings → Preferences → toggle Android Debug Bridge ON → authorize the USB debugging prompt.",
        "Port 5555 & authorization",
      ],
      [
        "One-Time State",
        "One-time optimization with preflight idempotency verification; card states NOT RUN / APPLIED / VERIFIED.",
        "Persistent store & idempotency",
      ],
      [
        "Restore & Rollback",
        "Unified rollback from the header, per-engine restore and diagnostic troubleshooting.",
        "Reversible operations & fixes",
      ],
    ]),
  },
  "emulator-debloater": {
    title: "Emulator Debloater guide",
    sub: "How ERROR OPTIMIZER cleans MSI App Player 5 safely",
    steps: steps([
      [
        "Scan and classify",
        "Packages, services and background components are listed as safe, recommended, protected, not applicable or requiring confirmation.",
      ],
      [
        "Everything eligible is pre-selected",
        "Protected packages are never selected for you. Each profile keeps its own selection.",
      ],
      ["Review before applying", "Review & apply lists exactly the selected changes."],
      ["Reversibility & rollback", "Every applied change can be rolled back at any time."],
    ]),
  },
  "emulator-advanced": {
    title: "Emulator Advanced Optimization guide",
    sub: "Simulated advanced and low-spec emulator review.",
    steps: steps([
      ["Connect", "The original operations need MSI App Player running with ADB turned on."],
      [
        "Review",
        "Check the compositor (SurfaceFlinger) timing and guest memory (Dalvik) options for your hardware.",
      ],
      [
        "Optimize",
        "Apply the eligible items; advanced risky tweaks stay off unless you allow them.",
      ],
      ["Restore", "Restore returns every item to its previous value."],
    ]),
    note: "This prototype does not connect to an emulator or measure performance.",
  },
};

/** Builds the standard sections from a guide record. */
export function derivedStepGuide(id: GuideId): StepGuide {
  const g: Guide = GUIDES[id];
  const [what, how, benefit, safety, when, limits, reversible] = GUIDE_SECTION_TITLES;
  const rows: (GuideStep | null)[] = [
    { title: what, text: g.what },
    { title: how, text: g.how, ...(g.details ? { points: g.details } : {}) },
    { title: benefit, text: g.benefit },
    g.safety ? { title: safety, text: g.safety } : null,
    { title: when, text: g.when },
    {
      title: limits,
      text: g.restart ? `${g.limits} Restart: ${g.restart}.` : g.limits,
      tag: RISK_LABEL[g.risk],
    },
    g.reversible ? { title: reversible, text: g.reversible } : null,
  ];
  return {
    title: `${g.title} guide`,
    sub: g.why,
    steps: rows.filter((r): r is GuideStep => r !== null),
  };
}

/** The GUIDE dialog content for a page (preserved original, or built from its guide record). */
export const stepGuide = (id: GuideId): StepGuide =>
  PRESERVED_STEP_GUIDES[id] ?? derivedStepGuide(id);

export const getGuide = (id: GuideId): Guide => GUIDES[id];

export const RISK_LABEL: Record<GuideRisk, string> = {
  info: "Info",
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};
