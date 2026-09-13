import {
  Aperture,
  CircleHelp,
  Folder,
  type LucideIcon,
  Puzzle,
  ShieldCheck,
} from "@lucide/svelte";

export type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  badge?: string;
  children?: { label: string; href: string; icon?: LucideIcon }[];
};

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "General",
    items: [
      { label: "Dashboard", href: "/", icon: Aperture },
      { label: "Projects", href: "/projects", icon: Folder },
      { label: "Skills", href: "/skills", icon: Puzzle },
    ],
  },
  {
    title: "Pages",
    items: [
      {
        label: "Auth",
        icon: ShieldCheck,
        children: [
          { label: "Sign In", href: "/sign-in" },
          { label: "Sign In (2 Col)", href: "/sign-in-2" },
          { label: "Sign Up", href: "/sign-up" },
          { label: "Forgot Password", href: "/forgot-password" },
          { label: "OTP", href: "/otp" },
        ],
      },
    ],
  },
  {
    title: "Other",
    items: [{ label: "Help Center", href: "/help-center", icon: CircleHelp }],
  },
];
