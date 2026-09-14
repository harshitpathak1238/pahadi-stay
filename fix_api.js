const fs = require('fs');

// Update POST route (route.ts)
let path = 'd:\\TourAndTravel\\app\\api\\admin\\listings\\route.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const optionalHouseRules = z.array(houseRuleSchema).max(30).optional().transform((rules) => rules ? rules.map((rule) => ({ title: rule.title.trim(), text: rule.text.trim() })).filter((rule) => rule.title && rule.text) : rules);",
  "const optionalHouseRules = z.array(houseRuleSchema).max(30).optional().transform((rules) => rules ? rules.map((rule) => ({ title: rule.title.trim(), text: rule.text.trim() })).filter((rule) => rule.title && rule.text) : rules);\nconst accommodationSchema = z.object({ title: z.string().trim().max(120), description: z.string().trim().max(1000), image: z.string().trim().url().max(500), bedrooms: z.coerce.number().int().nonnegative().optional(), beds: z.coerce.number().int().nonnegative().optional() });\nconst optionalAccommodations = z.array(accommodationSchema).max(30).optional().transform((accommodations) => accommodations ? accommodations.filter((accommodation) => accommodation.title) : accommodations);"
);

content = content.replace(
  "houseRules: optionalHouseRules, status: listingStatus });",
  "houseRules: optionalHouseRules, accommodations: optionalAccommodations, status: listingStatus });"
);

// Update POST handler to destructure accommodations
content = content.replace(
  "const { details, houseRules, landmarks, services, experiences, ...fields } = parsed.data;",
  "const { details, houseRules, landmarks, services, experiences, accommodations, ...fields } = parsed.data;"
);

// Update create data to include accommodations
content = content.replace(
  "...(houseRules ? { houseRules: houseRules as Prisma.InputJsonValue } : {}), landmarks: { create:",
  "...(houseRules ? { houseRules: houseRules as Prisma.InputJsonValue } : {}), accommodations: accommodations || [], landmarks: { create:"
);

fs.writeFileSync(path, content, 'utf8');
console.log('POST route updated');

// Update PATCH route ([id]/route.ts)
path = 'd:\\TourAndTravel\\app\\api\\admin\\listings\\[id]\\route.ts';
content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const optionalHouseRules = z.array(houseRuleSchema).max(30).optional().transform((rules) => rules ? rules.map((rule) => ({ title: rule.title.trim(), text: rule.text.trim() })).filter((rule) => rule.title && rule.text) : rules);",
  "const optionalHouseRules = z.array(houseRuleSchema).max(30).optional().transform((rules) => rules ? rules.map((rule) => ({ title: rule.title.trim(), text: rule.text.trim() })).filter((rule) => rule.title && rule.text) : rules);\nconst accommodationSchema = z.object({ title: z.string().trim().max(120), description: z.string().trim().max(1000), image: z.string().trim().url().max(500), bedrooms: z.coerce.number().int().nonnegative().optional(), beds: z.coerce.number().int().nonnegative().optional() });\nconst optionalAccommodations = z.array(accommodationSchema).max(30).optional().transform((accommodations) => accommodations ? accommodations.filter((accommodation) => accommodation.title) : accommodations);"
);

content = content.replace(
  "houseRules: optionalHouseRules, partnerId: z.string().trim().optional(), status: updateStatus }).superRefine",
  "houseRules: optionalHouseRules, accommodations: optionalAccommodations, partnerId: z.string().trim().optional(), status: updateStatus }).superRefine"
);

// Update PATCH handler to destructure and handle accommodations
content = content.replace(
  "const { category, partnerId, details, houseRules, landmarks, services, experiences, ...fields } = parsed.data;",
  "const { category, partnerId, details, houseRules, landmarks, services, experiences, accommodations, ...fields } = parsed.data;"
);

content = content.replace(
  "...(houseRules !== undefined ? { houseRules: houseRules as Prisma.InputJsonValue } : {}), ...(category ? { category } : {}),",
  "...(houseRules !== undefined ? { houseRules: houseRules as Prisma.InputJsonValue } : {}), ...(accommodations !== undefined ? { accommodations: accommodations as Prisma.InputJsonValue } : {}), ...(category ? { category } : {}),"
);

fs.writeFileSync(path, content, 'utf8');
console.log('PATCH route updated');
