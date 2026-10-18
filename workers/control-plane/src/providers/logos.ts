/** Small inline SVG marks for the provider dropdown (40×40, no external requests). */

const tile = (background: string, text: string, color = '#fff', size = 14) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><rect width="40" height="40" fill="${background}"/><text x="20" y="25" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${size}" fill="${color}">${text}</text></svg>`

export const LOGOS = {
  aws: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><rect width="40" height="40" fill="#232F3E"/><text x="20" y="21" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="13" fill="#fff">aws</text><path d="M9 26c7 4 15 4 22 0" stroke="#FF9900" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M28 24.2l3.6 1.6-1.4 3.4" stroke="#FF9900" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  azure: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><rect width="40" height="40" fill="#fff"/><path d="M17 8h8L15 32H7z" fill="#0078D4"/><path d="M21 16l12 16H18l8-4z" fill="#50A0E0"/></svg>`,
  gcp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><rect width="40" height="40" fill="#fff"/><path d="M12 25a6 6 0 0 1 1-12 9 9 0 0 1 16 2 5 5 0 0 1 0 10z" fill="none" stroke="#4285F4" stroke-width="3"/><path d="M12 25h8" stroke="#34A853" stroke-width="3"/><path d="M20 25h9" stroke="#FBBC04" stroke-width="3"/><path d="M13 13a9 9 0 0 1 9-4" stroke="#EA4335" stroke-width="3" fill="none"/></svg>`,
  cloudflare: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><rect width="40" height="40" fill="#fff"/><path d="M27 27H8a5 5 0 0 1 4-7 8 8 0 0 1 15-3 6 6 0 0 1 5 10z" fill="#F38020"/><path d="M33 27h-5l1-4a4 4 0 0 1 4 4z" fill="#FAAE40"/></svg>`,
  digitalocean: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><rect width="40" height="40" fill="#0080FF"/><path d="M20 31v-5a6 6 0 1 0-6-6H9a11 11 0 1 1 11 11z" fill="#fff"/><path d="M15 26h5v5h-5zM11 30h4v-4h-4z" fill="#fff"/></svg>`,
  hetzner: tile('#D50C2D', 'H', '#fff', 22),
  hostinger: tile('#673DE6', 'H', '#fff', 22),
  ovh: tile('#000E9C', 'OVH', '#fff', 12),
  stackit: tile('#004E5A', 'SIT', '#fff', 12),
  kubernetes: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><rect width="40" height="40" fill="#fff"/><path d="M20 5l12 6 3 13-8 10H13L5 24l3-13z" fill="#326CE5"/><circle cx="20" cy="20" r="6" fill="none" stroke="#fff" stroke-width="2"/><path d="M20 10v20M11 15l18 10M29 15l-18 10" stroke="#fff" stroke-width="1.6"/></svg>`,
  docker: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><rect width="40" height="40" fill="#1D63ED"/><path d="M7 21h25c0 6-5 10-13 10-7 0-11-4-12-10z" fill="#fff"/><path d="M10 17h4v3h-4zM15 17h4v3h-4zM20 17h4v3h-4zM15 13h4v3h-4zM20 13h4v3h-4z" fill="#fff"/></svg>`,
  'fly-io': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><rect width="40" height="40" fill="#24175B"/><path d="M20 7c7 0 11 6 9 13-1 6-6 12-9 13-3-1-8-7-9-13-2-7 2-13 9-13z" fill="#8B5CF6"/><path d="M20 12c3 0 4 5 3 10l-3 9-3-9c-1-5 0-10 3-10z" fill="#fff"/></svg>`,
  render: tile('#000', 'R', '#fff', 22),
  coolify: tile('#6B16ED', 'C', '#fff', 22),
  daytona: tile('#111', 'D', '#fff', 22),
} as const
