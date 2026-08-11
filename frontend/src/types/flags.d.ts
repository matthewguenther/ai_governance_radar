// Type shims for flag asset packages.
declare module "us-state-flags/USStateFlags" {
  import * as React from "react";
  export interface USStateFlagsProps {
    state: string;
    showFlag?: boolean;
    flagSize?: "xs" | "sm" | "md" | "lg";
    flagAlt?: string;
    className?: string;
    style?: React.CSSProperties;
  }
  const USStateFlags: React.FC<USStateFlagsProps>;
  export default USStateFlags;
}

declare module "flag-icons/css/flag-icons.min.css";
