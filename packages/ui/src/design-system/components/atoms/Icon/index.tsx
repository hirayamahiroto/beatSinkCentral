"use client";

import React from "react";
import type { LucideProps } from "lucide-react";
import {
  Mic,
  Calendar,
  Play,
  ArrowRight,
  Star,
  Globe,
  Trophy,
  LogIn,
  LayoutDashboard,
  User,
  AtSign,
  Loader2,
  X,
  Menu,
  Check,
  XCircle,
  Users,
} from "lucide-react";
import { cn } from "@ui/shared/utils/mergeClassNames";

const icons = {
  Mic,
  Calendar,
  Play,
  ArrowRight,
  Star,
  Globe,
  Trophy,
  LogIn,
  LayoutDashboard,
  User,
  AtSign,
  Loader2,
  X,
  Menu,
  Check,
  XCircle,
  Users,
} as const;

type IconName = keyof typeof icons;

const iconBehaviors: Partial<Record<IconName, { className: string }>> = {
  Loader2: { className: "animate-spin" },
};

type IconProps = LucideProps & {
  name: IconName;
};

export type { IconProps, IconName };

export const Icon = ({ name, className, ...props }: IconProps) => {
  const IconComponent = icons[name];
  const behaviorClassName = iconBehaviors[name]?.className;
  return (
    <IconComponent className={cn(behaviorClassName, className)} {...props} />
  );
};
