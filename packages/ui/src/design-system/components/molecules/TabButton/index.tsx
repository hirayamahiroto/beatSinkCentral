import React from "react";
import { Button } from "@ui/design-system/components/atoms/Button";

type TabButtonProps = {
  isActive: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
};

export type { TabButtonProps };

export const TabButton = ({
  isActive,
  onClick,
  icon: Icon,
  children,
}: TabButtonProps) => (
  <Button variant={isActive ? "default" : "ghost"} size="lg" onClick={onClick}>
    <Icon className="w-4 h-4" />
    {children}
  </Button>
);
