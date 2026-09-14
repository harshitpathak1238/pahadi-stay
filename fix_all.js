const fs = require('fs');

// ContentManager.tsx
const cmPath = 'd:\\TourAndTravel\\components\\admin\\ContentManager.tsx';
let cm = fs.readFileSync(cmPath, 'utf8');

// Add AccommodationRow type
cm = cm.replace(
  "export type AdminExperienceRow = { id?: string; title: string; note: string };\n",
  "export type AdminExperienceRow = { id?: string; title: string; note: string };\nexport type AccommodationRow = { id?: string; title: string; description: string; image: string; bedrooms: string; beds: string };\n"
);

// Add accommodations to Listing type
cm = cm.replace(
  "experiences?: AdminExperienceRow[] };\n",
  "experiences?: AdminExperienceRow[]; accommodations?: AccommodationRow[] };\n"
);

// Add accommodations to ListingForm type
cm = cm.replace(
  "experiences: AdminExperienceRow[] };\n",
  "experiences: AdminExperienceRow[]; accommodations: AccommodationRow[] };\n"
);

// Add accommodations to freshForm
cm = cm.replace(
  "  experiences: [],\n});\n",
  "  experiences: [],\n  accommodations: [],\n});\n"
);

fs.writeFileSync(cmPath, cm, 'utf8');
console.log('ContentManager.tsx updated');

// CategoryListingEditor.tsx
const clePath = 'd:\\TourAndTravel\\components\\admin\\CategoryListingEditor.tsx';
let cle = fs.readFileSync(clePath, 'utf8');

// Add AccommodationsEditor component before review panel
const accommodationsEditorCode = `
        const accommodationRows = form.accommodations || [];
        const addAccommodation = () => setForm((current) => ({ ...current, accommodations: [...(current.accommodations || []), { title: '', description: '', image: '', bedrooms: '', beds: '' }] }));
        const clearAccommodations = () => setForm((current) => ({ ...current, accommodations: [] }));
`;

cle = cle.replace(
  "const reorder = <T,>(items: T[], index: number, direction: -1 | 1) => {",
  accommodationsEditorCode + "\nconst reorder = <T,>(items: T[], index: number, direction: -1 | 1) => {"
);

// Add AccommodationsEditor usage in accommodations tab
cle = cle.replace(
  "            <FacilitiesEditor form={form} setForm={setForm} />\n          </>\n        )}",
  "            <FacilitiesEditor form={form} setForm={setForm} />\n            <AccommodationsEditor form={form} setForm={setForm} />\n          </>\n        )}"
);

fs.writeFileSync(clePath, cle, 'utf8');
console.log('CategoryListingEditor.tsx updated');
