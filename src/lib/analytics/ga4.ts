export type Ga4EventParameters = Record<string, string | number>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: "event", eventName: string, parameters: Ga4EventParameters) => void;
  }
}

export function sendGa4Event(eventName: string, parameters: Ga4EventParameters) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, parameters);
}

export function sendGa4PageView(pathname: string) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  const safePathname = pathname.split(/[?#]/, 1)[0] || "/";
  window.gtag("event", "page_view", {
    page_location: `${window.location.origin}${safePathname}`,
  });
}
