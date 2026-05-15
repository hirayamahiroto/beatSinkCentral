"use client";

import { useState } from "react";
import { Input } from "@ui/design-system/primitives/input";
import { Button } from "@ui/design-system/primitives/button";
import { useUpdateMyEmail } from "./hooks/useUpdateMyEmail";

type EmailEditorProps = {
  email: string;
};

export const EmailEditor = ({ email }: EmailEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(email);
  const { update, isLoading, error } = useUpdateMyEmail();

  const startEdit = () => {
    setDraft(email);
    setIsEditing(true);
  };

  const cancel = () => {
    setIsEditing(false);
    setDraft(email);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === "" || trimmed === email) {
      setIsEditing(false);
      return;
    }
    const ok = await update({ email: trimmed });
    if (ok) {
      setIsEditing(false);
    }
  };

  return (
    <section className="backdrop-blur-md bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400 mb-1">Email</p>
          {isEditing ? (
            <Input
              type="email"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white"
              autoFocus
            />
          ) : (
            <p className="text-white font-medium break-all">{email}</p>
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
