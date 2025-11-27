"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

export default function Logo() {
  const { resolvedTheme } = useTheme();

  const logo =
    resolvedTheme === "dark"
      ? "/images/suite33-white-image.png"
      : "/images/suite33-black-image.png";

  return (
    <Image
      src={logo}
      alt="Suite33 Logo"
      width={60}
      height={60}
      priority
      unoptimized
    />
  );
}
