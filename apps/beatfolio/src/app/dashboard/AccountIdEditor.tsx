"use client";

import { useState } from "react";
import { Input } from "@ui/design-system/primitives/input";
import { Button } from "@ui/design-system/primitives/button";
import { useUpdateMyAccountId } from "./hooks/useUpdateMyAccountId";

type AccountIdEditorProps = {
  accountId: string;
};

export const AccountIdEditor = ({ accountId }: AccountIdEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(accountId);
  const { update, isLoading, error } = useUpdateMyAccountId();

  const startEdit = () => {
    setDraft(accountId);
    setIsEditing(true);
  };

  const cancel = () => {
    setIsEditing(false);
    setDraft(accountId);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === "" || trimmed === accountId) {
      setIsEditing(false);
      return;
    }
    const ok = await update({ accountId: trimmed });
    if (ok) {
      setIsEditing(false);
    }
  };

  return (
    <section className="backdrop-blur-md bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400 mb-1">Account ID</p>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <span className="text-white font-medium">@</span>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white"
                autoFocus
              />
            </div>
          ) : (
            <p className="text-white font-medium break-all">@{accountId}</p>
          )}
          {error && (
            <p className="text-red-400 text-sm mt-2" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={cancel}
                disabled={isLoading}
              >
                キャンセル
              </Button>
              <Button type="button" onClick={save} disabled={isLoading}>
                {isLoading ? "保存中..." : "保存"}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={startEdit}>
              変更
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};
