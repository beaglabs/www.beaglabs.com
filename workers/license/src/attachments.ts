/** Chat attachment policy + R2 upload/download. */
import type { ChatActor } from './auth'
import { attachmentUrl, readerKey, toAttachment, type Attachment } from './chat-store'
import { first, getDb } from './db'
import type { Bindings } from './env'
import { requireConversation } from './visibility'
import { ApiError, id, now, str } from './util'

const MB = 1024 * 1024
export const LIMITS = { image: 15 * MB, video: 200 * MB, document: 50 * MB } as const

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/avif'])
const DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
])

export type AttachmentKind = keyof typeof LIMITS

/**
 * image/* ≤ 15 MB (raster formats only; SVG is refused because it can carry script),
 * video/mp4 ≤ 200 MB, documents (pdf, docx, xlsx, pptx, txt, csv) ≤ 50 MB.
 */
export function classifyAttachment(contentType: string, size: number): AttachmentKind {
  const type = contentType.toLowerCase().split(';')[0].trim()
  let kind: AttachmentKind
  if (IMAGE_TYPES.has(type)) kind = 'image'
  else if (type === 'video/mp4') kind = 'video'
  else if (DOCUMENT_TYPES.has(type)) kind = 'document'
  else throw new ApiError(415, 'unsupported_type', 'Allowed: images (JPEG, PNG, GIF, WebP, HEIC, AVIF), MP4 video, PDF, DOCX, XLSX, PPTX, TXT and CSV.')
  if (!Number.isInteger(size) || size <= 0) throw new ApiError(422, 'validation_error', 'size must be a positive integer.')
  if (size > LIMITS[kind]) throw new ApiError(413, 'attachment_too_large', `${kind} attachments must be at most ${LIMITS[kind] / MB} MB.`)
  return kind
}

function safeName(value: unknown): string {
  const name = str(value, 255)
  if (!name) throw new ApiError(422, 'validation_error', 'name is required.')
  return name.replace(/[\u0000-\u001f\u007f"\\/]/g, '_')
}

export async function createAttachment(env: Bindings, actor: ChatActor, body: Record<string, unknown>): Promise<{ attachmentId: string; uploadUrl: string }> {
  const conversationId = str(body.conversationId, 128)
  if (!conversationId) throw new ApiError(422, 'validation_error', 'conversationId is required.')
  const conversation = await requireConversation(env, actor, conversationId)
  const contentType = str(body.contentType, 200)?.toLowerCase().split(';')[0].trim() ?? ''
  const size = Number(body.size)
  const kind = classifyAttachment(contentType, size)
  const name = safeName(body.name)
  const uploader = readerKey(actor)
  const attachmentId = id('att')
  await getDb(env).execute({
    sql: `INSERT INTO chat_attachments (id, conversation_id, uploader_type, uploader_id, kind, name, content_type, size, r2_key, created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?)`,
    args: [attachmentId, conversation.id, uploader.type, uploader.id, kind, name, contentType, size, `conversations/${conversation.id}/${attachmentId}`, now()],
  })
  return { attachmentId, uploadUrl: attachmentUrl(env, attachmentId) }
}

type Row = Record<string, unknown>

async function loadVisibleAttachment(env: Bindings, actor: ChatActor, attachmentId: string): Promise<Row> {
  const row = first<Row>(await getDb(env).execute({ sql: 'SELECT * FROM chat_attachments WHERE id=?', args: [attachmentId] }))
  if (!row) throw new ApiError(404, 'not_found', 'Attachment was not found.')
  await requireConversation(env, actor, String(row.conversation_id))
  return row
}

export async function uploadAttachment(env: Bindings, actor: ChatActor, attachmentId: string, request: Request): Promise<Attachment> {
  const row = await loadVisibleAttachment(env, actor, attachmentId)
  const uploader = readerKey(actor)
  if (row.uploader_type !== uploader.type || row.uploader_id !== uploader.id) throw new ApiError(403, 'forbidden', 'Only the uploader can upload this attachment.')
  if (row.uploaded_at) throw new ApiError(409, 'already_uploaded', 'This attachment was already uploaded.')
  const declared = Number(row.size)
  const lengthHeader = request.headers.get('content-length')
  if (!lengthHeader) throw new ApiError(411, 'length_required', 'Content-Length is required.')
  const length = Number(lengthHeader)
  if (length > declared) throw new ApiError(413, 'attachment_too_large', 'Upload is larger than the declared size.')
  if (length !== declared) throw new ApiError(422, 'size_mismatch', 'Upload size does not match the declared size.')
  const contentType = request.headers.get('content-type')?.toLowerCase().split(';')[0].trim()
  if (contentType && contentType !== row.content_type) throw new ApiError(415, 'content_type_mismatch', 'Content-Type does not match the declared type.')
  if (!request.body) throw new ApiError(422, 'validation_error', 'Request body is empty.')
  const stored = await env.CHAT_ATTACHMENTS.put(String(row.r2_key), request.body, { httpMetadata: { contentType: String(row.content_type) } })
  if (!stored || stored.size !== declared) {
    await env.CHAT_ATTACHMENTS.delete(String(row.r2_key)).catch(() => undefined)
    throw new ApiError(422, 'size_mismatch', 'Upload size does not match the declared size.')
  }
  await getDb(env).execute({ sql: 'UPDATE chat_attachments SET uploaded_at=? WHERE id=?', args: [now(), attachmentId] })
  return toAttachment(env, row)
}

function parseRange(header: string | null, size: number): { offset: number; length: number } | null {
  const match = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null
  if (!match || (!match[1] && !match[2])) return null
  let start: number
  let end: number
  if (!match[1]) { start = Math.max(0, size - Number(match[2])); end = size - 1 } else {
    start = Number(match[1])
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
  }
  if (start > end || start >= size) throw new ApiError(416, 'range_not_satisfiable', 'Requested range is not satisfiable.')
  return { offset: start, length: end - start + 1 }
}

export async function downloadAttachment(env: Bindings, actor: ChatActor, attachmentId: string, request: Request): Promise<Response> {
  const row = await loadVisibleAttachment(env, actor, attachmentId)
  if (!row.uploaded_at) throw new ApiError(404, 'not_found', 'Attachment has not been uploaded yet.')
  const size = Number(row.size)
  const range = parseRange(request.headers.get('range'), size)
  const object = await env.CHAT_ATTACHMENTS.get(String(row.r2_key), range ? { range } : undefined)
  if (!object) throw new ApiError(404, 'not_found', 'Attachment content is missing.')
  const headers = new Headers({
    'Content-Type': String(row.content_type),
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
    'Content-Disposition': `${row.kind === 'document' ? 'attachment' : 'inline'}; filename="${String(row.name)}"; filename*=UTF-8''${encodeURIComponent(String(row.name))}`,
    'Content-Security-Policy': "default-src 'none'; sandbox",
  })
  if (range) {
    headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${size}`)
    headers.set('Content-Length', String(range.length))
    return new Response(object.body, { status: 206, headers })
  }
  headers.set('Content-Length', String(size))
  return new Response(object.body, { status: 200, headers })
}

// ---------------------------------------------------------------------------
// Account manager photos (public)

export const MAX_PHOTO_BYTES = 5 * MB
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function photoKey(accountManagerId: string): string {
  return `account-managers/${accountManagerId}/photo`
}

export async function putManagerPhoto(env: Bindings, accountManagerId: string, request: Request): Promise<string> {
  const contentType = request.headers.get('content-type')?.toLowerCase().split(';')[0].trim() ?? ''
  if (!PHOTO_TYPES.has(contentType)) throw new ApiError(415, 'unsupported_type', 'Photo must be JPEG, PNG or WebP.')
  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > MAX_PHOTO_BYTES) throw new ApiError(413, 'photo_too_large', 'Photo must be at most 5 MB.')
  const bytes = new Uint8Array(await request.arrayBuffer())
  if (!bytes.length) throw new ApiError(422, 'validation_error', 'Photo body is empty.')
  if (bytes.length > MAX_PHOTO_BYTES) throw new ApiError(413, 'photo_too_large', 'Photo must be at most 5 MB.')
  await env.CHAT_ATTACHMENTS.put(photoKey(accountManagerId), bytes, { httpMetadata: { contentType } })
  const base = (env.BASE_URL || 'https://license.beaglabs.com').replace(/\/+$/, '')
  const url = `${base}/api/chat/account-managers/${accountManagerId}/photo?v=${Date.now()}`
  await getDb(env).execute({ sql: 'UPDATE account_managers SET avatar_url=?, updated_at=? WHERE id=?', args: [url, now(), accountManagerId] })
  return url
}

export async function getManagerPhoto(env: Bindings, accountManagerId: string): Promise<Response> {
  if (!/^am_[A-Za-z0-9]+$/.test(accountManagerId)) throw new ApiError(404, 'not_found', 'Photo was not found.')
  const object = await env.CHAT_ATTACHMENTS.get(photoKey(accountManagerId))
  if (!object) throw new ApiError(404, 'not_found', 'Photo was not found.')
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  })
}
