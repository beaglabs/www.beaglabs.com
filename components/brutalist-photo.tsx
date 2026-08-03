import { cn } from '@/lib/utils'

type Props = {
  src: string
  alt: string
  badge?: string
  meta?: string
  rounded?: boolean
  className?: string
  imageClassName?: string
  aspect?: 'square' | 'video' | 'wide' | 'portrait'
  shadowSize?: 'sm' | 'md' | 'lg' | 'xl'
}

const ASPECT: Record<NonNullable<Props['aspect']>, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[16/9]',
  portrait: 'aspect-[3/4]',
}

const SHADOW: Record<NonNullable<Props['shadowSize']>, string> = {
  sm: 'shadow-[6px_6px_0px_0px_#ff5f1f]',
  md: 'shadow-[8px_8px_0px_0px_#ff5f1f]',
  lg: 'shadow-[10px_10px_0px_0px_#ff5f1f]',
  xl: 'shadow-[14px_14px_0px_0px_#ff5f1f]',
}

const BADGE_OFFSET: Record<NonNullable<Props['shadowSize']>, string> = {
  sm: '-top-3 -left-3 shadow-[3px_3px_0px_0px_#111]',
  md: '-top-3 -left-4 shadow-[4px_4px_0px_0px_#111]',
  lg: '-top-4 -left-4 shadow-[4px_4px_0px_0px_#111]',
  xl: '-top-5 -left-5 shadow-[5px_5px_0px_0px_#111]',
}

const META_OFFSET: Record<NonNullable<Props['shadowSize']>, string> = {
  sm: '-bottom-3 -right-3 shadow-[3px_3px_0px_0px_#111]',
  md: '-bottom-3 -right-3 shadow-[4px_4px_0px_0px_#111]',
  lg: '-bottom-3 -right-3 shadow-[4px_4px_0px_0px_#111]',
  xl: '-bottom-4 -right-4 shadow-[5px_5px_0px_0px_#111]',
}

export function BrutalistPhoto({
  src,
  alt,
  badge,
  meta,
  rounded = false,
  className,
  imageClassName,
  aspect = 'square',
  shadowSize = 'lg',
}: Props) {
  return (
    <div className={cn('relative', className)}>
      {badge && (
        <div
          className={cn(
            'absolute z-10 border-[3px] border-[#111] bg-[#ff5f1f] px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#111]',
            BADGE_OFFSET[shadowSize],
          )}
        >
          {badge}
        </div>
      )}
      <div
        className={cn(
          ASPECT[aspect],
          'overflow-hidden border-[3px] border-[#111] bg-[#111]',
          SHADOW[shadowSize],
          rounded && 'rounded-[2rem]',
        )}
      >
        <img
          src={src}
          alt={alt}
          className={cn(
            'h-full w-full object-cover grayscale-[15%] contrast-[1.05]',
            imageClassName,
          )}
          loading="lazy"
        />
      </div>
      {meta && (
        <div
          className={cn(
            'absolute z-10 border-[3px] border-[#111] bg-white px-3 py-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#111]',
            META_OFFSET[shadowSize],
          )}
        >
          {meta}
        </div>
      )}
    </div>
  )
}
