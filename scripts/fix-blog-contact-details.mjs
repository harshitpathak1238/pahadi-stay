/**
 * One-off data fix: correct the contact details stored inside blog HTML.
 *
 * Blog bodies are rich text authored in the admin editor, so the wrong phone
 * number and the old Gmail address live in the database — deploying code does
 * not clean them up. Run this against any environment that has the bad data:
 *
 *   node scripts/fix-blog-contact-details.mjs
 *
 * Safe to re-run: it only rewrites rows that still match the bad values.
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Display text, tel: targets and bare digits are all normalised to the same
// number so the visible label and the dialled digits can never drift apart.
const REPLACEMENTS = [
  { from: '+91 94103-379070', to: '+91 94103 79670' }, // mis-grouped display text
  { from: '+9194103379070', to: '+919410379670' }, // tel: href with a stray digit
  { from: '+91 9410379670', to: '+91 94103 79670' }, // ungrouped display variant
  { from: '9194103379070', to: '919410379670' }, // bare-digit variant
  { from: 'kainchidarshan@gmail.com', to: 'support@kainchidarshan.com' },
];

const TEXT_FIELDS = ['body', 'excerpt', 'metaDescription'];

function applyFixes(value) {
  if (typeof value !== 'string' || !value) return { value, changed: false };
  let next = value;
  for (const { from, to } of REPLACEMENTS) next = next.split(from).join(to);
  return { value: next, changed: next !== value };
}

async function main() {
  const posts = await db.blogPost.findMany({ select: { id: true, slug: true, body: true, excerpt: true, metaDescription: true } });
  let updated = 0;

  for (const post of posts) {
    const data = {};
    for (const field of TEXT_FIELDS) {
      const { value, changed } = applyFixes(post[field]);
      if (changed) data[field] = value;
    }
    if (!Object.keys(data).length) continue;
    await db.blogPost.update({ where: { id: post.id }, data });
    updated += 1;
    console.log(`fixed ${post.slug} (${Object.keys(data).join(', ')})`);
  }

  console.log(`\n${updated} of ${posts.length} blog posts updated.`);
  console.log('Run `npm run build` / redeploy so the blog cache is purged.');
}

main()
  .catch((error) => {
    console.error('Failed to fix blog contact details:', error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());