"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

/**
 * Faint, per-page house photo behind the whole app so inner pages aren't a
 * stark blank white. Each route group gets a different coloured home; a soft
 * white wash keeps text readable. Photos: free Unsplash license (public/bg).
 */
const ROUTE_IMAGE: Record<string, string> = {
  questionnaire: "/bg/warm.jpg",
  chat: "/bg/warm.jpg",
  results: "/bg/blue.jpg",
  orders: "/bg/blue.jpg",
  roadmap: "/bg/green.jpg",
  experts: "/bg/green.jpg",
  checklist: "/bg/brick.jpg",
  account: "/bg/brick.jpg",
  knowledge: "/bg/cottage.jpg",
  pricing: "/bg/sunset.jpg",
  login: "/bg/sunset.jpg",
  checkout: "/bg/sunset.jpg",
};

export default function PageBackground() {
  const pathname = usePathname();
  const segment = pathname.split("/")[1] ?? "";

  // Home has its own hero; admin stays plain.
  if (segment === "" || segment === "admin") return null;

  const src = ROUTE_IMAGE[segment];
  if (!src) return null;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        className="object-cover blur-[2px]"
      />
      {/* Soft white wash — keeps the photo faint and content legible. */}
      <div className="absolute inset-0 bg-white/80" />
    </div>
  );
}
