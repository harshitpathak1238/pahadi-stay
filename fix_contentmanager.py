import re

# Read ContentManager.tsx
f = r'd:\TourAndTravel\components\admin\ContentManager.tsx'
with open(f, 'r', newline='') as fh:
    content = fh.read()

# Add AccommodationRow type after AdminExperienceRow
content = content.replace(
    "export type AdminExperienceRow = { id?: string; title: string; note: string };\n",
    "export type AdminExperienceRow = { id?: string; title: string; note: string };\nexport type AccommodationRow = { id?: string; title: string; description: string; image: string; bedrooms: string; beds: string };\n"
)

# Add accommodations to Listing type (before the closing });
content = content.replace(
    "experiences?: AdminExperienceRow[] };",
    "experiences?: AdminExperienceRow[]; accommodations?: AccommodationRow[] };"
)

# Add accommodations to ListingForm type
content = content.replace(
    "experiences: AdminExperienceRow[] };",
    "experiences: AdminExperienceRow[]; accommodations: AccommodationRow[] };"
)

# Add accommodations to freshForm
content = content.replace(
    "  experiences: [],\n});",
    "  experiences: [],\n  accommodations: [],\n});"
)

with open(f, 'w', newline='') as fh:
    fh.write(content)

print("ContentManager.tsx done")
