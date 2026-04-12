import React from "react";
import { Icon } from "@ui/design-system/components/atoms/Icon";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Link } from "@ui/design-system/components/atoms/Link";

type NavItem = {
  href: string;
  label: string;
};

type FooterLink = {
  href: string;
  label: string;
};

type AuthAction = {
  href: string;
  label: string;
};

type LayoutProps = {
  children: React.ReactNode;
  isLoggedIn: boolean;
  homeHref: string;
  navItems: NavItem[];
  authAction: AuthAction;
  dashboardAction: AuthAction;
  footerLinks: FooterLink[];
  renderLink: (props: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => React.ReactNode;
};

export const Layout = ({
  children,
  isLoggedIn,
  homeHref,
  navItems,
  authAction,
  dashboardAction,
  footerLinks,
  renderLink,
}: LayoutProps) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {renderLink({
            href: homeHref,
            className: "text-xl font-bold text-white",
            children: "Beat Sink Central",
          })}
          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <Button asChild>
                {renderLink({
                  href: dashboardAction.href,
                  className: "flex items-center gap-2",
                  children: (
                    <>
                      <Icon name="LayoutDashboard" className="w-4 h-4" />
                      {dashboardAction.label}
                    </>
                  ),
                })}
              </Button>
            ) : (
              <Button asChild>
                {renderLink({
                  href: authAction.href,
                  className: "flex items-center gap-2",
                  children: (
                    <>
                      <Icon name="LogIn" className="w-4 h-4" />
                      {authAction.label}
                    </>
                  ),
                })}
              </Button>
            )}
          </nav>
        </div>
      </header>

      {children}

      <footer className="bg-black/50 backdrop-blur-sm py-8 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">
              &copy; 2024 Beat Sink Central. All rights reserved.
            </p>
            <div className="flex gap-6">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
