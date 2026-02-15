import React from "react";
import { LazyLoadImage as BaseImage } from "react-lazy-load-image-component";

type ImageProps = React.ComponentProps<typeof BaseImage> & {
  src: string;
  alt?: string;
};

export type { ImageProps };

export const Image = ({ src, alt, ...props }: ImageProps) => (
  <BaseImage src={src} alt={alt || ""} {...props} />
);
