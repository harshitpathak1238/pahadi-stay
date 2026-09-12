import { z } from 'zod';

const categoryScore = z.coerce.number().min(1).max(10);
const optionalEmail = z
  .union([z.string().trim().email(), z.literal('')])
  .optional()
  .transform((value) => (value ? value.trim() : null));

// Public submission: anonymous-with-basic-info (no public guest auth exists,
// checkout is guest checkout). Always created as PENDING — never auto-approved.
export const publicReviewSchema = z
  .object({
    listingId: z
      .string({
        message: 'This stay could not be identified. Please reload the page and try again.',
      })
      .min(1, 'This stay could not be identified. Please reload the page and try again.'),
    guestName: z.string().trim().min(2).max(80),
    guestEmail: optionalEmail,
    comment: z.string().trim().min(10).max(2000),
    staff: categoryScore.nullish(),
    facilities: categoryScore.nullish(),
    cleanliness: categoryScore.nullish(),
    comfort: categoryScore.nullish(),
    valueForMoney: categoryScore.nullish(),
    location: categoryScore.nullish(),
    // Honeypot: real users never fill this hidden field; bots often do.
    website: z.string().max(200).optional().default(''),
  })
  .superRefine((value, context) => {
    const given = [value.staff, value.facilities, value.cleanliness, value.comfort, value.valueForMoney, value.location].filter(
      (score): score is number => typeof score === 'number',
    );
    if (!given.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Please rate at least one category.', path: ['staff'] });
    }
  });

export type PublicReviewInput = z.infer<typeof publicReviewSchema>;

// Admin: full moderation/edit + manual creation (offline/WhatsApp testimonials).
export const adminReviewSchema = z.object({
  listingId: z.string().min(1).optional(),
  guestName: z.string().trim().min(1).max(80),
  guestEmail: z
    .union([z.string().trim().email(), z.literal(''), z.null()])
    .optional()
    .transform((value) => (typeof value === 'string' && value ? value.trim() : null)),
  comment: z.string().trim().min(1).max(5000),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isVerified: z.boolean().optional(),
  overallRating: z.coerce.number().min(1).max(5).optional(),
  staff: categoryScore.nullish(),
  facilities: categoryScore.nullish(),
  cleanliness: categoryScore.nullish(),
  comfort: categoryScore.nullish(),
  valueForMoney: categoryScore.nullish(),
  location: categoryScore.nullish(),
  bookingId: z.union([z.string().min(1), z.literal(''), z.null()]).optional().transform((value) => (value ? value : null)),
});

export type AdminReviewInput = z.infer<typeof adminReviewSchema>;
export const adminReviewUpdateSchema = adminReviewSchema.partial();
