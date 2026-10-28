import Image from 'next/image';
import { responsiveImageSrcSet } from '@/lib/responsive-images';

type ResponsiveImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes: string;
  priority?: boolean;
};

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  className,
  sizes,
  priority = false,
}: ResponsiveImageProps) {
  const srcSet = responsiveImageSrcSet(src);
  if (!srcSet)
    return (
      <Image
        unoptimized
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
      />
    );

  return (
    // Native img is intentional: these R2 URLs already point at generated
    // variants, and srcSet lets the browser choose without a paid image proxy.
    // oxlint-disable-next-line next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  );
}
