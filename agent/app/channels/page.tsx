'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import type { Channel } from '@/lib/types'
import {
  ExternalLink,
  Loader2,
  Settings,
  Plug,
  X,
  Check,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface ChannelConfig {
  id: string
  name: string
  description: string
  category: 'messaging' | 'email' | 'support' | 'productivity' | 'payment'
  color: string
  connected: boolean
  configurable: boolean
  docsUrl: string
  fields: ConfigField[]
}

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'password' | 'select' | 'toggle'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
}

const CHANNELS: ChannelConfig[] = [
  {
    id: 'discord',
    name: 'Discord',
    description: 'Send and receive messages via Discord bots and servers',
    category: 'messaging',
    color: '#5865F2',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: 'MTEx...' },
      { key: 'guildId', label: 'Guild ID', type: 'text', required: true, placeholder: '123456789' },
      { key: 'channelId', label: 'Channel ID', type: 'text', placeholder: '987654321' },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Connect Facebook Messenger for customer conversations',
    category: 'messaging',
    color: '#1877F2',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'pageAccessToken', label: 'Page Access Token', type: 'password', required: true },
      { key: 'verifyToken', label: 'Verify Token', type: 'password', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Automate issues, PRs, and repository workflows',
    category: 'productivity',
    color: '#24292F',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'privateKey', label: 'Private Key', type: 'password', required: true },
      { key: 'installationId', label: 'Installation ID', type: 'text', required: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
    ],
  },
  {
    id: 'google-chat',
    name: 'Google Chat',
    description: 'Integrate with Google Workspace chat spaces',
    category: 'messaging',
    color: '#00AC47',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'serviceAccountKey', label: 'Service Account Key (JSON)', type: 'password', required: true },
      { key: 'spaceId', label: 'Space ID', type: 'text', placeholder: 'spaces/AAA...' },
    ],
  },
  {
    id: 'intercom',
    name: 'Intercom',
    description: 'Handle support conversations and customer messaging',
    category: 'support',
    color: '#286EFA',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
    ],
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Manage issues, projects, and team workflows',
    category: 'productivity',
    color: '#5E6AD2',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'teamId', label: 'Team ID', type: 'text' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
    ],
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Collaborate via Teams channels and conversations',
    category: 'messaging',
    color: '#6264A7',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', required: true },
      { key: 'appPassword', label: 'App Password', type: 'password', required: true },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Read and write Notion pages, databases, and blocks',
    category: 'productivity',
    color: '#000000',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'apiKey', label: 'Integration Token', type: 'password', required: true },
      { key: 'databaseId', label: 'Default Database ID', type: 'text' },
    ],
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Send and receive transactional emails',
    category: 'email',
    color: '#000000',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 're_...' },
      { key: 'fromEmail', label: 'From Email', type: 'text', required: true, placeholder: 'agent@example.com' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Manage CRM records, leads, and opportunities',
    category: 'support',
    color: '#00A1E0',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'instanceUrl', label: 'Instance URL', type: 'text', required: true, placeholder: 'https://yourorg.salesforce.com' },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password' },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Manage orders, products, and customer data',
    category: 'payment',
    color: '#96BF48',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'shopDomain', label: 'Shop Domain', type: 'text', required: true, placeholder: 'your-store.myshopify.com' },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages, manage channels, and handle events',
    category: 'messaging',
    color: '#4A154B',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: 'xoxb-...' },
      { key: 'appToken', label: 'App Token', type: 'password', required: true, placeholder: 'xapp-...' },
      { key: 'signingSecret', label: 'Signing Secret', type: 'password' },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Handle payments, subscriptions, and invoices',
    category: 'payment',
    color: '#635BFF',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, placeholder: 'sk_live_...' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
      { key: 'apiVersion', label: 'API Version', type: 'text', placeholder: '2024-06-20' },
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Build bots and handle Telegram conversations',
    category: 'messaging',
    color: '#26A5E4',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: '123456:ABC-...' },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://...' },
    ],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Send and receive SMS, MMS, and voice calls',
    category: 'messaging',
    color: '#F22F46',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true, placeholder: 'AC...' },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'phoneNumber', label: 'Phone Number', type: 'text', required: true, placeholder: '+1234567890' },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Connect WhatsApp Business for customer messaging',
    category: 'messaging',
    color: '#25D366',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'verifyToken', label: 'Verify Token', type: 'password', required: true },
      { key: 'businessAccountId', label: 'Business Account ID', type: 'text' },
    ],
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Manage support tickets and customer conversations',
    category: 'support',
    color: '#03363D',
    connected: false,
    configurable: true,
    docsUrl: 'https://flueframework.com/docs/guide/channels/',
    fields: [
      { key: 'subdomain', label: 'Subdomain', type: 'text', required: true, placeholder: 'yourcompany' },
      { key: 'email', label: 'Email', type: 'text', required: true, placeholder: 'admin@example.com' },
      { key: 'apiToken', label: 'API Token', type: 'password', required: true },
    ],
  },
]

function ChannelIcon({ id, size = 24 }: { id: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    discord: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
    facebook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    github: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    'google-chat': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
      </svg>
    ),
    intercom: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.182c5.418 0 9.818 4.399 9.818 9.818S17.418 21.818 12 21.818 2.182 17.418 2.182 12 6.582 2.182 12 2.182zm-1.091 5.454v10.91h2.182V7.636h-2.182zm-3.273 3.273v6.545h2.182v-6.545H7.636zm6.545 0v6.545h2.182v-6.545h-2.182zm3.273-3.273v10.91h2.182V7.636h-2.182z" />
      </svg>
    ),
    linear: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.846 14.678L14.678 2.846c4.62 4.62 4.62 12.106 0 16.726-4.62 4.62-12.106 4.62-16.726 0h14.894V0C9.226 0 1.74 9.226 2.846 14.678z" />
      </svg>
    ),
    'microsoft-teams': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.2 6.4c.9 0 1.6.7 1.6 1.6s-.7 1.6-1.6 1.6c-.3 0-.5-.1-.8-.2-.1-.3-.2-.6-.2-.9 0-.7.3-1.4.8-1.8.1-.1.3-.2.4-.2zm-7.2 1.6c1.8 0 3.2-1.4 3.2-3.2S13.8 1.6 12 1.6 8.8 3 8.8 4.8 10.2 8 12 8zm7.2 1.6c-.5 0-.9.1-1.3.3.3.5.5 1.2.5 1.9 0 .7-.2 1.3-.5 1.8.4.2.8.3 1.3.3 1.8 0 3.2-1.4 3.2-3.2s-1.4-3.1-3.2-3.1zM12 9.6c-3.5 0-6.4 2.4-7.2 5.6-.1.4.2.8.6.8h13.2c.4 0 .7-.4.6-.8-.8-3.2-3.7-5.6-7.2-5.6zm-8 7.2v1.6c0 .9.7 1.6 1.6 1.6h12.8c.9 0 1.6-.7 1.6-1.6v-1.6H4z" />
      </svg>
    ),
    notion: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.29-1.006c.28 0 .04-.28-.04-.374L17.6 1.22c-.374-.374-.746-.187-1.12-.093l-12.56.94c-.56.187-.654.374-.56.934l1.006 11.784c.093.56.28.746.654.653l6.908-.94c.187 0 .28.187.187.374l-.56 7.584c-.093.467-.28.654-.746.56l-5.228-.654c-.374-.093-.56-.093-.746.28l-1.406 1.78c-.28.374-.093.654.28.746l7.282 1.594c.56.187 1.12.094 1.494-.28l9.4-12.14c.28-.467.28-.84-.094-1.12l-1.406-1.026c-.28-.28-.654-.187-.934.094L8.58 18.852c-.187.187-.28.187-.467.093l-3.654-2.64c-.28-.187-.374-.56-.093-.84l.093-.093z" />
      </svg>
    ),
    resend: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M1.5 3h21L12 13.5 1.5 3zm0 1.5L12 15l10.5-10.5v15a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5v-15z" />
      </svg>
    ),
    salesforce: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.94.9 3.69 2.205a4.82 4.82 0 011.5-.24c2.115 0 3.84 1.665 3.99 3.75a4.47 4.47 0 01-.99 8.715 4.515 4.515 0 01-3.045-1.125 4.17 4.17 0 01-3.615 2.16 4.185 4.185 0 01-3.96-2.85 3.72 3.72 0 01-1.17.195c-2.07 0-3.75-1.665-3.75-3.72s1.68-3.72 3.75-3.72c.36 0 .705.06 1.035.165A4.185 4.185 0 0110.006 5.415z" />
      </svg>
    ),
    shopify: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.337 2.034c-.067-.034-.147-.02-.2.024-.36.306-.78.54-1.236.684a3.82 3.82 0 01-1.476.108c-.204-.036-.396-.108-.576-.204-.18-.096-.336-.228-.456-.384a1.92 1.92 0 01-.276-.516c-.108-.384-.12-.792-.036-1.188.072-.336.228-.648.456-.912.156-.18.348-.324.564-.432.216-.108.456-.168.708-.18.168-.012.336.012.492.06.156.048.3.12.432.216.132.096.24.216.324.36.06.108.096.228.108.348.012.12.012.24-.024.36-.048.156-.132.288-.24.408-.108.12-.24.216-.384.288-.144.072-.3.12-.456.144-.12.024-.24.024-.36.012-.096-.012-.192-.036-.276-.072a1.08 1.08 0 01-.216-.12c-.06-.048-.108-.108-.144-.168-.024-.048-.036-.108-.036-.16 0-.06.012-.108.036-.156l.048-.06z" />
      </svg>
    ),
    slack: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
      </svg>
    ),
    stripe: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-7.076-2.15l-.89 5.57C5.166 22.735 7.985 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
      </svg>
    ),
    telegram: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    twilio: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c4.636 0 8.4 3.764 8.4 8.4s-3.764 8.4-8.4 8.4-8.4-3.764-8.4-8.4S7.364 3.6 12 3.6zm0 2.4a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8zm0 7.2a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8zm4.8-3.6a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8zm-9.6 0a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8z" />
      </svg>
    ),
    whatsapp: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    zendesk: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.014 0L0 16.192h5.762L7.014 0zm9.972 0l-1.252 16.192H22.5L16.986 0zM7.014 24l1.252-7.808H2.5L7.014 24zm9.972 0l6.514-7.808h-5.762L16.986 24z" />
      </svg>
    ),
  }

  return <>{icons[id] || <Plug size={size} />}</>
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/flue/admin/channels')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setChannels(data)
        }
      })
      .catch(() => setChannels([]))
      .finally(() => setLoading(false))
  }, [])

  function getChannelStatus(id: string): 'connected' | 'disconnected' | 'error' {
    const ch = channels.find(c => c.name === id)
    return ch?.status || 'disconnected'
  }

  function isConnected(id: string): boolean {
    return getChannelStatus(id) === 'connected'
  }

  async function handleConnect(channelId: string) {
    const config = configValues[channelId]
    if (!config) return

    const channelConfig = CHANNELS.find(c => c.id === channelId)
    const missingRequired = channelConfig?.fields
      .filter(f => f.required)
      .some(f => !config[f.key]?.trim())

    if (missingRequired) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      await fetch(`/api/flue/admin/channels/${channelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      toast.success(`${channelConfig?.name} connected successfully`)
      setConfiguring(null)
      setConfigValues(prev => ({ ...prev, [channelId]: {} }))
      // Refresh channels
      const res = await fetch('/api/flue/admin/channels')
      const data = await res.json()
      if (Array.isArray(data)) setChannels(data)
    } catch {
      toast.error('Failed to connect channel')
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect(channelId: string) {
    setConnecting(channelId)
    try {
      await fetch(`/api/flue/admin/channels/${channelId}`, { method: 'DELETE' })
      toast.success('Channel disconnected')
      const res = await fetch('/api/flue/admin/channels')
      const data = await res.json()
      if (Array.isArray(data)) setChannels(data)
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setConnecting(null)
    }
  }

  function updateConfigValue(channelId: string, key: string, value: string) {
    setConfigValues(prev => ({
      ...prev,
      [channelId]: { ...(prev[channelId] || {}), [key]: value },
    }))
  }

  const categories = [
    { id: 'all', label: 'All Channels' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'email', label: 'Email' },
    { id: 'support', label: 'Support' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'payment', label: 'Payment' },
  ]

  const filteredChannels = filter === 'all'
    ? CHANNELS
    : CHANNELS.filter(c => c.category === filter)

  const connectedCount = CHANNELS.filter(c => isConnected(c.id)).length

  return (
    <>
      <PageHeader
        title="Channels"
        description={`Connect messaging, email, and support platforms — ${connectedCount} connected`}
      >
        <a
          href="https://flueframework.com/docs/guide/channels/"
          target="_blank"
          rel="noopener noreferrer"
          className="nb-btn-outline px-4 py-2 text-sm flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Docs
        </a>
      </PageHeader>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-4 py-2 text-sm font-bold border-2 border-black transition-all ${
              filter === cat.id
                ? 'bg-[var(--accent)] shadow-[3px_3px_0px_0px_#111]'
                : 'bg-white hover:bg-[var(--sidebar-accent)] shadow-[2px_2px_0px_0px_#111]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 nb-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChannels.map((channel) => {
            const connected = isConnected(channel.id)
            const status = getChannelStatus(channel.id)
            const isConfiguringThis = configuring === channel.id

            return (
              <div
                key={channel.id}
                className={`nb-card bg-white overflow-hidden transition-all ${
                  connected ? 'ring-2 ring-green-500 ring-offset-2' : ''
                }`}
              >
                {/* Channel Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 border-2 border-black flex items-center justify-center"
                        style={{ backgroundColor: channel.color + '15', color: channel.color }}
                      >
                        <ChannelIcon id={channel.id} size={28} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{channel.name}</h3>
                        <StatusBadge
                          status={connected ? 'connected' : 'disconnected'}
                          className="!py-0.5 !px-2 !text-[10px]"
                        />
                      </div>
                    </div>
                    {connected && (
                      <button
                        onClick={() => handleDisconnect(channel.id)}
                        disabled={connecting === channel.id}
                        className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                      >
                        {connecting === channel.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Disconnect'
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mb-4">
                    {channel.description}
                  </p>

                  {/* Action Button */}
                  {!connected && (
                    <button
                      onClick={() => {
                        setConfiguring(isConfiguringThis ? null : channel.id)
                        if (!configValues[channel.id]) {
                          setConfigValues(prev => ({
                            ...prev,
                            [channel.id]: {},
                          }))
                        }
                      }}
                      className="nb-btn-outline w-full px-4 py-2 text-sm flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      {isConfiguringThis ? 'Close' : 'Configure'}
                      {!isConfiguringThis && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </button>
                  )}

                  {connected && (
                    <a
                      href={channel.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nb-chip !py-1 !px-3 !text-xs hover:bg-[var(--accent)] transition-colors w-full justify-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Docs
                    </a>
                  )}
                </div>

                {/* Configuration Form */}
                {isConfiguringThis && !connected && (
                  <div className="border-t-[3px] border-black p-5 bg-[var(--sidebar)]">
                    <div className="space-y-3">
                      {channel.fields.map((field) => (
                        <div key={field.key}>
                          <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)] block mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-0.5">*</span>}
                          </label>
                          <input
                            type={field.type}
                            value={configValues[channel.id]?.[field.key] || ''}
                            onChange={(e) => updateConfigValue(channel.id, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full border-2 border-black px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => handleConnect(channel.id)}
                        disabled={saving}
                        className="nb-btn-orange flex-1 px-4 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        {saving ? 'Connecting...' : 'Connect'}
                      </button>
                      <button
                        onClick={() => setConfiguring(null)}
                        className="nb-btn-outline px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
