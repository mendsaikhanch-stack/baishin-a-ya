"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// A different home greets the visitor on each visit. SSR renders the first
// image (stable hydration); the client then picks a random one on mount.
const HERO_IMAGES = [
  "/hero-house.jpg",
  "/bg/warm.jpg",
  "/bg/green.jpg",
  "/bg/brick.jpg",
  "/bg/cottage.jpg",
  "/bg/blue.jpg",
];

export default function HeroImage() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(Math.floor(Math.random() * HERO_IMAGES.length));
  }, []);

  return (
    <Image
      key={idx}
      src={HERO_IMAGES[idx]}
      alt="Орчин үеийн хувийн байшин"
      fill
      priority
      sizes="(max-width: 1024px) 100vw, 50vw"
      className="object-cover animate-[fadeIn_0.5s_ease]"
    />
  );
}
