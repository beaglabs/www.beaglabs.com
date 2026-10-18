import type { ComponentChildren } from 'preact'

/** Square-capped line icons, 16px, currentColor. Decorative unless labelled by the control they sit in. */

const Svg = ({ children, size = 16 }: { children: ComponentChildren; size?: number }) => (
  <svg class="ic" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true" focusable="false">
    {children}
  </svg>
)

export const IconExternal = () => (
  <Svg>
    <path d="M9 3h4v4M13 3 7 9M11 9v4H3V5h4" />
  </Svg>
)
export const IconRefresh = () => (
  <Svg>
    <path d="M13 3v4H9" />
    <path d="M12.5 7A5 5 0 1 0 13 10" />
  </Svg>
)
export const IconSearch = () => (
  <Svg>
    <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10ZM11 11l3 3" />
  </Svg>
)
export const IconChevron = ({ dir = 'down' }: { dir?: 'down' | 'up' | 'left' | 'right' }) => (
  <Svg>
    <path d={dir === 'down' ? 'm4 6 4 4 4-4' : dir === 'up' ? 'm4 10 4-4 4 4' : dir === 'left' ? 'm10 4-4 4 4 4' : 'm6 4 4 4-4 4'} />
  </Svg>
)
export const IconCheck = () => (
  <Svg>
    <path d="m3 8 3 3 7-7" />
  </Svg>
)
export const IconClose = () => (
  <Svg>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Svg>
)
export const IconLock = () => (
  <Svg size={14}>
    <path d="M4 7h8v7H4zM6 7V5a2 2 0 1 1 4 0v2" />
  </Svg>
)
export const IconAlert = () => (
  <Svg>
    <path d="M8 2 1.5 14h13L8 2ZM8 7v3M8 12v.5" />
  </Svg>
)
export const IconPower = () => (
  <Svg>
    <path d="M8 2v6M4.5 4.5a5 5 0 1 0 7 0" />
  </Svg>
)
export const IconPlay = () => (
  <Svg>
    <path d="M5 3v10l8-5-8-5Z" />
  </Svg>
)
export const IconRedeploy = () => (
  <Svg>
    <path d="M3 13V9h4M3.5 9A5 5 0 1 1 5 12.5" />
  </Svg>
)
export const IconSliders = () => (
  <Svg>
    <path d="M2 4h7M13 4h1M2 12h1M7 12h7M9 2v4M5 10v4" />
  </Svg>
)
export const IconArrowDown = () => (
  <Svg>
    <path d="M8 2v11M3.5 8.5 8 13l4.5-4.5" />
  </Svg>
)
export const IconSort = ({ dir }: { dir: 'asc' | 'desc' | null }) => (
  <Svg size={12}>
    <path d={dir === 'asc' ? 'm4 10 4-4 4 4' : dir === 'desc' ? 'm4 6 4 4 4-4' : 'm5 6 3-3 3 3M5 10l3 3 3-3'} />
  </Svg>
)
