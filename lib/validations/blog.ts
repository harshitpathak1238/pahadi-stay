import { z } from 'zod';

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
  featuredImage: z.string().max(500).nullable().optional(),
  imageAltText: z.string().trim().max(200).nullable().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  scheduledAt: z.coerce.date().nullable().optional(),
});

export const blogUpdateSchema = blogSchema.partial();
export type BlogInput = z.infer<typeof blogSchema>;
