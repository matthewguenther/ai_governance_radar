// Type shims for prototype-only flag packages (TEMPORARY, delete with this folder).
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
  export const USStateFlags: React.FC<USStateFlagsProps>;
  export default USStateFlags;
}

declare module "flag-icons/css/flag-icons.min.css";
