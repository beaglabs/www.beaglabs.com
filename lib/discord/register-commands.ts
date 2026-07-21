/**
 * One-shot script to register slash commands with Discord.
 * Run: npx tsx lib/discord/register-commands.ts
 */

const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const GUILD_ID = process.env.DISCORD_GUILD_ID

if (!APPLICATION_ID || !BOT_TOKEN) {
  console.error('Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN')
  process.exit(1)
}

const commands = [
  {
    name: 'ping',
    description: 'Check if the bot is alive',
    type: 1,
  },
  {
    name: 'kick',
    description: 'Kick a member from the server',
    type: 1,
    default_member_permissions: '2', // KICK_MEMBERS
    dm_permission: false,
    options: [
      {
        name: 'member',
        description: 'The member to kick',
        type: 6, // USER
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for the kick',
        type: 3, // STRING
        required: false,
      },
    ],
  },
  {
    name: 'ban',
    description: 'Ban a member from the server',
    type: 1,
    default_member_permissions: '4', // BAN_MEMBERS
    dm_permission: false,
    options: [
      {
        name: 'member',
        description: 'The member to ban',
        type: 6, // USER
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for the ban',
        type: 3, // STRING
        required: false,
      },
    ],
  },
  {
    name: 'mute',
    description: 'Timeout a member for a number of minutes',
    type: 1,
    default_member_permissions: '1099511627776', // MODERATE_MEMBERS
    dm_permission: false,
    options: [
      {
        name: 'member',
        description: 'The member to mute',
        type: 6, // USER
        required: true,
      },
      {
        name: 'minutes',
        description: 'Duration in minutes (1-40320)',
        type: 4, // INTEGER
        required: true,
        min_value: 1,
        max_value: 40320,
      },
      {
        name: 'reason',
        description: 'Reason for the mute',
        type: 3, // STRING
        required: false,
      },
    ],
  },
  {
    name: 'unmute',
    description: 'Remove a timeout from a member',
    type: 1,
    default_member_permissions: '1099511627776', // MODERATE_MEMBERS
    dm_permission: false,
    options: [
      {
        name: 'member',
        description: 'The member to unmute',
        type: 6, // USER
        required: true,
      },
    ],
  },
  {
    name: 'purge',
    description: 'Bulk-delete messages from this channel',
    type: 1,
    default_member_permissions: '8192', // MANAGE_MESSAGES
    dm_permission: false,
    options: [
      {
        name: 'count',
        description: 'Number of messages to delete (1-100)',
        type: 4, // INTEGER
        required: true,
        min_value: 1,
        max_value: 100,
      },
    ],
  },
  {
    name: 'embed',
    description: 'Post a custom embed to this channel',
    type: 1,
    default_member_permissions: '8192', // MANAGE_MESSAGES
    dm_permission: false,
    options: [
      {
        name: 'title',
        description: 'Embed title',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'description',
        description: 'Embed description',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'color',
        description: 'Hex color (e.g. 5865F2)',
        type: 3, // STRING
        required: false,
      },
    ],
  },
  {
    name: 'ask',
    description: 'Ask the Beag Labs AI assistant a question',
    type: 1,
    dm_permission: false,
    options: [
      {
        name: 'prompt',
        description: 'Your question or request',
        type: 3, // STRING
        required: true,
      },
    ],
  },
]

async function register() {
  const url = GUILD_ID
    ? `https://discord.com/api/v10/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`Failed to register commands (${res.status}):`, text)
    process.exit(1)
  }

  const data = await res.json()
  console.log(`Registered ${data.length} commands${GUILD_ID ? ` in guild ${GUILD_ID}` : ' globally'}`)
}

register()
