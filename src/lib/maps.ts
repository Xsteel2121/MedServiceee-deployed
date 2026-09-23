export const MAPS_CONFIG = {
  twoGisApiKey: process.env.NEXT_PUBLIC_2GIS_API_KEY || "",
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
};

export function build2GisRouteUrl(name: string, city: string, address: string, latitude?: number | null, longitude?: number | null) {
  if (latitude != null && longitude != null) {
    return `https://2gis.kz/routeSearch/rsType/auto/to/${longitude},${latitude}`;
  }
  return `https://2gis.kz/search/${encodeURIComponent(`${name}, ${city}, ${address}`)}`;
}

export function buildGoogleMapsRouteUrl(name: string, city: string, address: string, latitude?: number | null, longitude?: number | null) {
  const destination = latitude != null && longitude != null
    ? `${latitude},${longitude}`
    : `${name}, ${city}, ${address}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

let googleMapsPromise: Promise<void> | null = null;
let twoGisPromise: Promise<void> | null = null;

/** Loads the Google Maps SDK only when a public key was configured. */
export function loadGoogleMapsSdk(): Promise<void> {
  if (typeof window === "undefined" || !MAPS_CONFIG.googleMapsApiKey) return Promise.resolve();
  const browserWindow = window as Window & { google?: { maps?: unknown } };
  if (browserWindow.google?.maps) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-medservice-google-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps SDK failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.dataset.medserviceGoogleMaps = "true";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_CONFIG.googleMapsApiKey)}&libraries=places`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps SDK failed to load"));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

/** Loads the 2GIS Web SDK when a public key is configured. */
export function load2GisSdk(): Promise<void> {
  if (typeof window === "undefined" || !MAPS_CONFIG.twoGisApiKey) return Promise.resolve();
  if (twoGisPromise) return twoGisPromise;
  twoGisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-medservice-2gis]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("2GIS SDK failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.dataset.medservice2gis = "true";
    script.async = true;
    script.src = `https://maps.api.2gis.ru/2.0/loader.js?pkg=full&key=${encodeURIComponent(MAPS_CONFIG.twoGisApiKey)}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("2GIS SDK failed to load"));
    document.head.appendChild(script);
  });
  return twoGisPromise;
}
