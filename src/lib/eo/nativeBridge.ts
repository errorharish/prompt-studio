// Desktop host window bridge (Phase 1 Frontend Prototype Mode)
declare global {
  interface Window {
    chrome?: {
      webview?: {
        postMessage: (message: any) => void;
      };
    };
  }
}

export function isDesktopApp(): boolean {
  return typeof window !== "undefined" && !!window.chrome?.webview;
}

export function minimizeWindow() {
  if (typeof window !== "undefined" && window.chrome?.webview) {
    window.chrome.webview.postMessage(JSON.stringify({ action: "window:minimize" }));
  }
}

export function closeWindow() {
  if (typeof window !== "undefined" && window.chrome?.webview) {
    window.chrome.webview.postMessage(JSON.stringify({ action: "window:close" }));
  }
}

export function dragWindow() {
  if (typeof window !== "undefined" && window.chrome?.webview) {
    window.chrome.webview.postMessage(JSON.stringify({ action: "window:drag" }));
  }
}
