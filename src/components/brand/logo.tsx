// Official TenderChain logo assets. Render the uploaded PNGs exactly as provided.
// No CSS filters. No background boxes. No cropping. Aspect ratio is preserved.
import * as React from "react";
import { cn } from "@/lib/utils";
import horizontalLogo from "@/assets/brand/Tender_final_right_side_logo.png";
import monogramLogo from "@/assets/brand/tender_monogram.png";
import stackedLogo from "@/assets/brand/tender_straight_logo.png";

export type LogoVariant = "horizontal" | "monogram" | "stacked";

const SRC: Record<LogoVariant, string> = {
  horizontal: horizontalLogo,
  monogram: monogramLogo,
  stacked: stackedLogo,
};

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: LogoVariant;
}

export function TenderChainLogo({
  variant = "horizontal",
  className,
  alt = "TenderChain",
  ...rest
}: LogoProps) {
  return (
    <img
      src={SRC[variant]}
      alt={alt}
      draggable={false}
      className={cn("block w-auto select-none object-contain", className)}
      {...rest}
    />
  );
}
