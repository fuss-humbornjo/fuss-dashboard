import {
  Aperture,
  Bell,
  Bug,
  CircleHelp,
  Construction,
  FileX,
  Folder,
  type LucideIcon,
  Monitor,
  Package,
  Palette,
  Puzzle,
  ServerOff,
  Settings,
  ShieldCheck,
  UserCog,
  UserX,
  Wrench,
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
      { label: "Apps", href: "/apps", icon: Package },
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
      {
        label: "Errors",
        icon: Bug,
        children: [
          { label: "Forbidden", href: "/errors/forbidden", icon: UserX },
          { label: "Not Found", href: "/errors/not-found", icon: FileX },
          {
            label: "Internal Server Error",
            href: "/errors/internal-server-error",
            icon: ServerOff,
          },
          {
            label: "Maintenance Error",
            href: "/errors/maintenance-error",
            icon: Construction,
          },
        ],
      },
    ],
  },
  {
    title: "Other",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        children: [
          { label: "Profile", href: "/settings", icon: UserCog },
          { label: "Account", href: "/settings/account", icon: Wrench },
          { label: "Appearance", href: "/settings/appearance", icon: Palette },
          {
            label: "Notifications",
            href: "/settings/notifications",
            icon: Bell,
          },
          { label: "Display", href: "/settings/display", icon: Monitor },
        ],
      },
      { label: "Help Center", href: "/help-center", icon: CircleHelp },
    ],
  },
];
