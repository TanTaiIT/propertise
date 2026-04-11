import { z } from "zod"

const bannerPositionEnum = z.enum([
  "HOME_HERO",
  "HOME_PROMO",
  "SIDEBAR",
  "POST_DETAIL",
  "CATEGORY_PAGE",
  "POPUP",
  "ANNOUNCEMENT",
])

const bannerRolesEnum = z.enum(["guest", "user", "staff", "admin"])

export const createBannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url("Invalid image URL").or(z.string().min(1, "Image URL is required")),
  mobileImageUrl: z.string().url().optional().nullable(),
  clickUrl: z.string().url().optional().nullable(),
  position: bannerPositionEnum.default("HOME_HERO"),
  priority: z.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(false),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  targetRoles: z.array(bannerRolesEnum).default(["guest", "user"]),
  targetCategories: z.array(z.string()).default([]),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#000000"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#ffffff"),
  overlayOpacity: z.number().int().min(0).max(100).default(0),
  height: z.string().max(20).default("500px"),
  ctaText: z.string().max(50).optional().nullable(),
})

export const updateBannerSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().or(z.string().min(1)).optional(),
  mobileImageUrl: z.string().url().optional().nullable(),
  clickUrl: z.string().url().optional().nullable(),
  position: bannerPositionEnum.optional(),
  priority: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  targetRoles: z.array(bannerRolesEnum).optional(),
  targetCategories: z.array(z.string().uuid()).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  overlayOpacity: z.number().int().min(0).max(100).optional(),
  height: z.string().max(20).optional(),
  ctaText: z.string().max(50).optional().nullable(),
})

export const reorderBannerSchema = z.object({
  priority: z.number().int().min(0).max(9999),
})

export const bulkReorderSchema = z.object({
  orderUpdates: z
    .array(
      z.object({
        id: z.string().uuid(),
        priority: z.number().int().min(0),
      })
    )
    .min(1),
})
