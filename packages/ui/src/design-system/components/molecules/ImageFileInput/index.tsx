import React from "react";
import { Button } from "@ui/design-system/components/atoms/Button";
import { Image } from "@ui/design-system/components/atoms/Image";
import { Typography } from "@ui/design-system/components/atoms/Typography";

type ImageFileInputProps = {
  value: string | null;
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  accept?: string;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-describedby"?: string;
};

export type { ImageFileInputProps };

export const ImageFileInput = ({
  value,
  onFileSelect,
  isUploading = false,
  accept = "image/*",
  disabled = false,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: ImageFileInputProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isInteractive = !disabled && !isUploading;

  return (
    <div className="flex items-center gap-4">
      {value !== null ? (
        <Image
          src={value}
          alt=""
          className="h-20 w-20 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-white/10 bg-white/5">
          <Typography variant="small" tone="muted">
            未設定
          </Typography>
        </div>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={!isInteractive}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelect(file);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!isInteractive}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading
          ? "アップロード中..."
          : value !== null
            ? "画像を変更"
            : "画像を選択"}
      </Button>
    </div>
  );
};
ImageFileInput.displayName = "ImageFileInput";
