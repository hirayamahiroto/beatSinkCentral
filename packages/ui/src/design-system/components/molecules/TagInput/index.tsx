import React from "react";
import { Badge } from "@ui/design-system/components/atoms/Badge";
import { Input } from "@ui/design-system/components/atoms/Input";

type TagInputProps = {
  // 現在のタグ一覧
  value: string[];
  // タグ追加・削除時に新しい配列で通知する
  onChange: (next: string[]) => void;
  id?: string;
  placeholder?: string;
};

export type { TagInputProps };

// 自由入力で複数タグ（ジャンル等）を扱う複合 UI。RHF には依存せず value / onChange の Controlled API で提供する。
export const TagInput = ({
  value,
  onChange,
  id,
  placeholder,
}: TagInputProps) => {
  const [draft, setDraft] = React.useState("");

  const addTag = () => {
    const tag = draft.trim();
    if (tag === "" || value.includes(tag)) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/5 p-2">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          <button
            type="button"
            aria-label={`${tag} を削除`}
            onClick={() => removeTag(tag)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            ×
          </button>
        </Badge>
      ))}
      <Input
        id={id}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
        }}
        className="h-7 flex-1 border-0 bg-transparent p-1 focus-visible:ring-0"
      />
    </div>
  );
};
TagInput.displayName = "TagInput";
