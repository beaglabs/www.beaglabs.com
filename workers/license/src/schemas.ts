import { z } from 'zod'
import { DEPLOYMENT_PROFILES } from './env'

const nullableText = z.string().trim().min(1).max(512).nullable().optional()
const optionalText = z.string().trim().min(1).max(512).optional()
const cents = z.number().int().nonnegative()
const isoDate = z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))

export const organizationCreateSchema = z.object({
  organizationType: z.enum(['federal_agency', 'state_local', 'commercial', 'prime', 'distributor', 'reseller', 'integrator', 'partner']),
  legalName: z.string().trim().min(1).max(256),
  displayName: nullableText,
  uei: nullableText,
  cageCode: nullableText,
  domain: nullableText,
  status: z.enum(['active', 'inactive', 'prospect']).default('active'),
})

export const organizationPatchSchema = organizationCreateSchema.partial()

export const contactCreateSchema = z.object({
  organizationId: z.string().min(1),
  firstName: z.string().trim().min(1).max(128),
  lastName: z.string().trim().min(1).max(128),
  title: nullableText,
  email: z.string().email().nullable().optional(),
  phone: nullableText,
  contactType: z.enum(['mission_owner', 'contracting', 'technical', 'security', 'billing', 'partner_manager', 'sales', 'executive', 'other']).default('other'),
  isPrimary: z.boolean().default(false),
})

export const contactPatchSchema = contactCreateSchema.omit({ organizationId: true }).partial()

export const partnerCreateSchema = z.object({
  organizationId: z.string().min(1),
  partnerType: z.enum(['distributor', 'reseller', 'prime', 'systems_integrator', 'referral', 'technology']),
  partnerStatus: z.enum(['prospect', 'active', 'inactive', 'terminated']).default('prospect'),
  agreementStatus: z.enum(['none', 'negotiating', 'active', 'expired', 'terminated']).default('none'),
  discountTier: nullableText,
  onboardedAt: isoDate.nullable().optional(),
})

export const partnerPatchSchema = partnerCreateSchema.omit({ organizationId: true }).partial()

export const vehicleCreateSchema = z.object({
  vehicleName: z.string().trim().min(1).max(256),
  vehicleType: z.string().trim().min(1).max(128),
  vehicleNumber: nullableText,
  holderOrganizationId: z.string().nullable().optional(),
  startDate: isoDate.nullable().optional(),
  endDate: isoDate.nullable().optional(),
  status: z.enum(['planned', 'active', 'expired', 'inactive']).default('active'),
})

export const vehiclePatchSchema = vehicleCreateSchema.partial()

export const opportunityCreateSchema = z.object({
  customerOrganizationId: z.string().min(1),
  originatingPartnerId: z.string().nullable().optional(),
  transactingPartnerId: z.string().nullable().optional(),
  primaryContactId: z.string().nullable().optional(),
  name: z.string().trim().min(1).max(256),
  stage: z.enum(['identified', 'qualified', 'pilot_proposed', 'technical_validation', 'procurement', 'verbal', 'closed_won', 'closed_lost']),
  estimatedValueCents: cents.nullable().optional(),
  vehicleId: z.string().nullable().optional(),
  expectedProductId: z.string().nullable().optional(),
  expectedCloseDate: isoDate.nullable().optional(),
})

export const opportunityPatchSchema = opportunityCreateSchema.omit({ customerOrganizationId: true }).partial()

export const orderItemCreateSchema = z.object({
  productId: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().positive().max(1000).default(1),
  unitPriceCents: cents.optional(),
  discountCents: cents.default(0),
  serviceStart: isoDate.nullable().optional(),
  serviceEnd: isoDate.nullable().optional(),
}).refine((value) => Boolean(value.productId || value.sku), { message: 'productId or sku is required' })

export const orderCreateSchema = z.object({
  customerOrganizationId: z.string().min(1),
  purchaserOrganizationId: z.string().nullable().optional(),
  originatingPartnerId: z.string().nullable().optional(),
  transactingPartnerId: z.string().nullable().optional(),
  vehicleId: z.string().nullable().optional(),
  opportunityId: z.string().nullable().optional(),
  contractNumber: nullableText,
  taskOrderNumber: nullableText,
  poNumber: nullableText,
  status: z.enum(['draft', 'booked']).default('draft'),
  currency: z.string().trim().length(3).default('USD'),
  orderedAt: isoDate.nullable().optional(),
  startDate: isoDate.nullable().optional(),
  endDate: isoDate.nullable().optional(),
  primaryContactId: z.string().nullable().optional(),
  billingContactId: z.string().nullable().optional(),
  items: z.array(orderItemCreateSchema).min(1).max(100),
})

export const orderPatchSchema = z.object({
  status: z.enum(['draft', 'booked', 'fulfilled', 'cancelled', 'refunded']),
})

export const entitlementCreateSchema = z.object({
  orderItemId: z.string().min(1),
  validFrom: isoDate,
  validUntil: isoDate.nullable().optional(),
  notes: nullableText,
})

export const entitlementPatchSchema = z.object({
  status: z.enum(['pending', 'active', 'expired', 'suspended', 'revoked']),
  notes: nullableText,
})

export const deploymentCreateSchema = z.object({
  entitlementId: z.string().min(1),
  deploymentName: z.string().trim().min(1).max(256),
  papyrusDeploymentId: z.string().regex(/^[a-f0-9]{64}$/i),
  deploymentProfile: z.enum(DEPLOYMENT_PROFILES),
  activationPublicKeyPem: optionalText.nullable(),
})

export const deploymentPatchSchema = z.object({
  status: z.enum(['registered', 'licensed', 'suspended', 'retired']),
})
