export const routes = {
  home: "/",
  players: "/players",
  event: "/event",
  dashboard: "/dashboard",
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
  },
} as const;

export const navItems = [
  { href: routes.players, label: "Players" },
  { href: routes.event, label: "Events" },
] as const;

export const footerLinks = [
  { href: "#", label: "About" },
  { href: "#", label: "Terms" },
] as const;

export const authAction = {
  href: routes.auth.login,
  label: "Log in",
} as const;

export const dashboardAction = {
  href: routes.dashboard,
  label: "Dashboard",
} as const;
