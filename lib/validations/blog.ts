import { z } from 'zod';

const blogStatus = z.preprocess((value) => typeof value === 'string' ? value.trim().toUpperCase() : value, z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'));
const optionalUrl = z.union([z.string().trim().max(500).optional(), z.literal('')]).transform((value) => (typeof value === 'string' ? value.trim() : value)).nullable().optional();

export const blogSchema = z.object({
  slug: z.string().trim().max(160).default(''),
  title: z.string().trim().max(160).default(''),
  metaTitle: z.string().trim().max(160).default(''),
  metaDescription: z.string().trim().max(320).default(''),
  excerpt: z.string().trim().max(320).default(''),
  body: z.string().trim().max(200000).default(''),
  authorName: z.string().trim().max(100).default(''),
  authorId: z.string().cuid().nullable().optional(),
  category: z.string().trim().max(60).default(''),
  primaryKeyword: z.string().trim().max(100).default(''),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  featuredImage: optionalUrl,
  imageAltText: z.string().trim().max(200).nullable().optional(),
  status: blogStatus,
  scheduledAt: z.coerce.date().nullable().optional(),
});

export const blogUpdateSchema = blogSchema.partial();
export type BlogInput = z.infer<typeof blogSchema>;
