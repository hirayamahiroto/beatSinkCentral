import React from "react";
import { Search } from "lucide-react";
import { Input } from "@ui/design-system/components/atoms/Input";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export type { SearchInputProps };

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) => (
  <div className="relative">
    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
    <Input
      className="pl-10"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
