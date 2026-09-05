export type ListingDetails = Record<string, unknown>;

const text = (details: ListingDetails, key: string) => typeof details[key] === 'string' ? details[key].trim() : '';
const number = (details: ListingDetails, key: string) => Number(details[key]);

export function listingLiveRequirements(category: string, listing: { title?: string; description?: string; basePrice?: unknown; sellPrice?: unknown; images?: unknown; location?: string; details?: unknown }) {
  const details = listing.details && typeof listing.details === 'object' && !Array.isArray(listing.details) ? listing.details as ListingDetails : {};
  const images = Array.isArray(listing.images) ? listing.images.filter((image) => typeof image === 'string' && image.trim()) : [];
  const missing: string[] = [];
  const requiredText = (value: string, label: string) => { if (!value) missing.push(label); };
  const requiredNumber = (value: number, label: string) => { if (!Number.isFinite(value) || value <= 0) missing.push(label); };

  requiredText(listing.title?.trim() || '', 'title');
  requiredText(listing.description?.trim() || '', 'description');
  requiredNumber(Number(listing.basePrice), 'base price');
  requiredNumber(Number(listing.sellPrice), 'selling price');

  if (category === 'STAY') {
    requiredText(text(details, 'propertyType'), 'property type');
    requiredText(text(details, 'roomArrangement'), 'room arrangement');
    requiredText(text(details, 'fullAddress'), 'full address');
    requiredText(text(details, 'mapPin'), 'map pin');
    requiredNumber(number(details, 'maxGuests'), 'maximum guests');
    requiredNumber(number(details, 'bedrooms'), 'bedrooms');
    requiredNumber(number(details, 'beds'), 'beds');
    requiredNumber(number(details, 'bathrooms'), 'bathrooms');
    requiredText(text(details, 'checkIn'), 'check-in time');
    requiredText(text(details, 'checkOut'), 'check-out time');
    requiredText(text(details, 'cancellationPolicy'), 'cancellation policy');
    if (images.length < 5) missing.push('at least 5 photos');
  } else if (category === 'RENTAL') {
    requiredText(text(details, 'vehicleType'), 'vehicle type');
    requiredText(text(details, 'makeModel'), 'make/model');
    requiredText(text(details, 'year'), 'vehicle year');
    requiredText(text(details, 'registrationNumber'), 'registration/license plate');
    requiredText(text(details, 'transmission'), 'transmission type');
    requiredNumber(number(details, 'dailyPrice'), 'daily price');
    requiredNumber(number(details, 'quantity'), 'quantity available');
    if (images.length < 3) missing.push('at least 3 photos');
  } else if (category === 'ACTIVITY') {
    requiredText(text(details, 'included'), 'what is included');
    requiredText(text(details, 'groupMin'), 'minimum group size');
    requiredText(text(details, 'groupMax'), 'maximum group size');
    requiredText(text(details, 'safetyInformation'), 'safety information');
    if (images.length < 5) missing.push('at least 5 photos');
  } else if (category === 'RIDE') {
    requiredText(text(details, 'vehicleType'), 'vehicle type');
    requiredNumber(number(details, 'passengerCapacity'), 'passenger capacity');
    requiredText(text(details, 'route'), 'route or custom pickup');
    if (images.length < 2) missing.push('at least 2 photos');
  }
  return missing;
}

export function packageLiveRequirements(packageItem: { price?: unknown; listingIds?: unknown; details?: unknown }) {
  const details = packageItem.details && typeof packageItem.details === 'object' && !Array.isArray(packageItem.details) ? packageItem.details as ListingDetails : {};
  const missing: string[] = [];
  if (!Array.isArray(packageItem.listingIds) || packageItem.listingIds.length < 1) missing.push('at least one bundled listing');
  if (!Number.isFinite(Number(packageItem.price)) || Number(packageItem.price) <= 0) missing.push('package selling price');
  if (!text(details, 'duration')) missing.push('duration');
  return missing;
}