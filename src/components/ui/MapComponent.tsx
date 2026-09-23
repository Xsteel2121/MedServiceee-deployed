"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "@/i18n/LanguageContext";
import { build2GisRouteUrl, load2GisSdk, loadGoogleMapsSdk } from "@/lib/maps";

interface MapComponentProps {
  clinics: Clinic[];
  selectedClinicId?: string | null;
}

interface Clinic {
  id: string;
  name: string;
  city: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviews_count?: number | null;
}

const defaultCenter: [number, number] = [43.238949, 76.889709];
const clinicPin = L.divIcon({
  className: "medservice-map-pin",
  html: "<span style=\"display:flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.28);color:white;font-size:17px;font-weight:700\">✚</span>",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export default function MapComponent({ clinics, selectedClinicId }: MapComponentProps) {
  const { locale } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, { lat: number; lng: number; marker: L.Marker }>());

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    leafletMap.current = L.map(mapRef.current, { zoomControl: true }).setView(defaultCenter, 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(leafletMap.current);
    markerLayer.current = L.layerGroup().addTo(leafletMap.current);
    void loadGoogleMapsSdk().catch(() => undefined);
    void load2GisSdk().catch(() => undefined);
    const mountedMarkers = markersRef.current;

    const resizeTimer = window.setTimeout(() => leafletMap.current?.invalidateSize(), 100);
    return () => {
      window.clearTimeout(resizeTimer);
      leafletMap.current?.remove();
      leafletMap.current = null;
      markerLayer.current = null;
      mountedMarkers.clear();
    };
  }, []);

  useEffect(() => {
    const map = leafletMap.current;
    const layer = markerLayer.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersRef.current.clear();

    const withCoords = clinics.filter((clinic) => clinic.latitude != null && clinic.longitude != null);
    if (withCoords.length === 0) {
      map.setView(defaultCenter, 12);
      return;
    }

    const noAddress = locale === "kk" ? "Мекенжай көрсетілмеген" : "Адрес не указан";
    const reviewsLabel = locale === "kk" ? "пікір" : "отз.";
    const detailsLabel = locale === "kk" ? "Толығырақ" : "Подробнее";

    withCoords.forEach((clinic) => {
      const lat = clinic.latitude as number;
      const lng = clinic.longitude as number;
      const popup = document.createElement("div");
      popup.style.cssText = "font-family: sans-serif; min-width: 170px;";
      const title = document.createElement("h4");
      title.style.cssText = "margin: 0 0 4px 0; font-size: 14px; font-weight: 700;";
      title.textContent = clinic.name;
      const address = document.createElement("div");
      address.style.cssText = "color: #666; font-size: 12px; margin-bottom: 4px;";
      address.textContent = `${clinic.city}, ${clinic.address || noAddress}`;
      const rating = document.createElement("div");
      rating.style.cssText = "color: #f59e0b; font-size: 12px; margin-bottom: 8px;";
      rating.textContent = `★ ${clinic.rating ?? "—"} (${clinic.reviews_count ?? 0} ${reviewsLabel})`;
      const link = document.createElement("a");
      link.href = `/clinics/${encodeURIComponent(clinic.id)}`;
      link.style.cssText = "display: block; background: #2563eb; color: white; text-align: center; padding: 4px 0; border-radius: 4px; text-decoration: none; font-size: 12px;";
      link.textContent = detailsLabel;
      const gisLink = document.createElement("a");
      gisLink.href = build2GisRouteUrl(clinic.name, clinic.city, clinic.address || "", lat, lng);
      gisLink.target = "_blank";
      gisLink.rel = "noopener noreferrer";
      gisLink.style.cssText = "display: block; margin-top: 4px; color: #6b9e20; text-align: center; font-size: 12px;";
      gisLink.textContent = "Маршрут в 2GIS";
      popup.append(title, address, rating, link, gisLink);

      const marker = L.marker([lat, lng], { icon: clinicPin }).addTo(layer);
      marker.bindPopup(popup);
      markersRef.current.set(clinic.id, { lat, lng, marker });
    });

    const bounds = L.latLngBounds(withCoords.map((clinic) => [clinic.latitude as number, clinic.longitude as number]));
    if (withCoords.length === 1) {
      map.setView([withCoords[0].latitude as number, withCoords[0].longitude as number], 14);
    } else {
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
    }
  }, [clinics, locale]);

  useEffect(() => {
    if (!selectedClinicId || !leafletMap.current) return;
    const selected = markersRef.current.get(selectedClinicId);
    if (!selected) return;
    leafletMap.current.flyTo([selected.lat, selected.lng], 16, { animate: true, duration: 0.8 });
    selected.marker.openPopup();
  }, [selectedClinicId, clinics]);

  return <div ref={mapRef} className="w-full h-full min-h-[400px] rounded-xl z-0 relative" />;
}
