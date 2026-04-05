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

type IconProps = LucideProps & {
  name: IconName;
};

export type { IconProps, IconName };

export const Icon = ({ name, ...props }: IconProps) => {
  const IconComponent = icons[name];
  return <IconComponent {...props} />;
};
