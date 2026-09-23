import ClinicDetailClient from "./ClinicDetailClient";

export function generateStaticParams() {
  return Array.from({ length: 100 }, (_, index) => ({ id: String(index + 1) }));
}

export default function ClinicDetailPage() {
  return <ClinicDetailClient />;
}
