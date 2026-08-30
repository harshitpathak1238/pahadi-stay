import { z } from 'zod';

export const blogSchema = z.object({
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only.'),
  title: z.string().trim().min(2).max(160),
  metaTitle: z.string().trim().min(2).max(160),
  metaDescription: z.string().trim().min(50).max(320),
  excerpt: z.string().trim().min(20).max(320),
  body: z.string().trim().min(50),
  authorName: z.string().trim().min(2).max(100),
  authorId: z.string().cuid().nullable().optional(),
  category: z.string().trim().min(2).max(60),
  primaryKeyword: z.string().trim().min(2).max(100),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  featuredImage: z.string().max(500).nullable().optional(),
  imageAltText: z.string().trim().max(200).nullable().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  scheduledAt: z.coerce.date().nullable().optional(),
});

export const blogUpdateSchema = blogSchema.partial();
export type BlogInput = z.infer<typeof blogSchema>;
