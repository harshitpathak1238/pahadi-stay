import {
  AlarmClock,
  Bath,
  BedDouble,
  BedSingle,
  BellRing,
  CheckCircle2,
  CigaretteOff,
  Clock,
  ConciergeBell,
  DoorOpen,
  Fan,
  Footprints,
  Languages,
  Monitor,
  Plane,
  Shirt,
  ShowerHead,
  SquareParking,
  Toilet,
  TreePine,
  Tv,
  Users,
  WashingMachine,
  Wifi,
  Wind,
  type LucideIcon,
} from 'lucide-react';

export const OTHER_FACILITY_CATEGORY = 'Other';

export const defaultFacilityIcon = CheckCircle2;

/** Presentation-only lookup: known facility label -> icon + category group.
 *  The actual per-stay facility list always comes from the stay's own data;
 *  anything not found here renders under "Other" with the default icon. */
export const facilityMeta: Record<string, { icon: LucideIcon; category: string }> = {
  'Private bathroom': { icon: Bath, category: 'Bathroom' },
  Toilet: { icon: Toilet, category: 'Bathroom' },
  Shower: { icon: ShowerHead, category: 'Bathroom' },
  'Toilet paper': { icon: WashingMachine, category: 'Bathroom' },
  Slippers: { icon: Footprints, category: 'Bathroom' },

  Linen: { icon: Shirt, category: 'Bedroom' },
  'Wardrobe or closet': { icon: DoorOpen, category: 'Bedroom' },
  'Clothes rack': { icon: Shirt, category: 'Bedroom' },

  'Air conditioning': { icon: Wind, category: 'Room' },
  'Family rooms': { icon: Users, category: 'Room' },
  'Flat-screen TV': { icon: Tv, category: 'Room' },
  'Room amenities': { icon: BedSingle, category: 'Room' },
  Terrace: { icon: TreePine, category: 'Room' },

  'Media & Technology': { icon: Monitor, category: 'Room' },

  'Free WiFi': { icon: Wifi, category: 'Internet' },
  'WiFi is available in all areas and is free of charge.': { icon: Wifi, category: 'Internet' },

  'Parking available': { icon: SquareParking, category: 'Services' },
  'Airport shuttle': { icon: Plane, category: 'Services' },
  'Room service': { icon: BellRing, category: 'Services' },
  'Wake-up service': { icon: AlarmClock, category: 'Services' },
  '24-hour front desk': { icon: Clock, category: 'Services' },
  Concierge: { icon: ConciergeBell, category: 'Services' },

  'Non-smoking rooms': { icon: CigaretteOff, category: 'General' },
  'Non-smoking throughout': { icon: CigaretteOff, category: 'General' },
  Fan: { icon: Fan, category: 'General' },

  English: { icon: Languages, category: 'Languages spoken' },
  Hindi: { icon: Languages, category: 'Languages spoken' },

  'King bed': { icon: BedDouble, category: 'Bedroom' },
};

export const facilityCategoryOrder = [
  'Bathroom',
  'Bedroom',
  'Room',
  'Internet',
  'Parking',
  'Services',
  'General',
  'Languages spoken',
  OTHER_FACILITY_CATEGORY,
];
