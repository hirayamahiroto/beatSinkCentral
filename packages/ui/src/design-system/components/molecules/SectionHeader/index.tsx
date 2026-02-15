import React from "react";

type SectionHeaderProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  actionButton?: React.ReactNode;
};

export type { SectionHeaderProps };

export const SectionHeader = ({
  icon: Icon,
  title,
  actionButton,
}: SectionHeaderProps) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl text-white font-bold flex items-center gap-2">
      <Icon className="w-5 h-5 text-purple-400" />
      {title}
    </h2>
    {actionButton}
  </div>
);
