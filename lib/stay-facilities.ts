export type StayFacilityGroup = {
  title: string;
  items: { key: string; label: string }[];
};

export const stayFacilityGroups: StayFacilityGroup[] = [
  {
    title: 'Great for your stay',
    items: [
      { key: 'privateBathroom', label: 'Private bathroom' },
      { key: 'airConditioning', label: 'Air conditioning' },
      { key: 'freeWifi', label: 'Free WiFi' },
      { key: 'airportShuttle', label: 'Airport shuttle' },
      { key: 'familyRooms', label: 'Family rooms' },
      { key: 'roomService', label: 'Room service' },
      { key: 'nonSmokingRooms', label: 'Non-smoking rooms' },
      { key: 'flatScreenTv', label: 'Flat-screen TV' },
      { key: 'shower', label: 'Shower' },
    ],
  },
  {
    title: 'Bathroom',
    items: [
      { key: 'toiletPaper', label: 'Toilet paper' },
      { key: 'slippers', label: 'Slippers' },
      { key: 'toilet', label: 'Toilet' },
    ],
  },
  {
    title: 'Bedroom',
    items: [
      { key: 'linen', label: 'Linen' },
      { key: 'wardrobe', label: 'Wardrobe or closet' },
      { key: 'clothesRack', label: 'Clothes rack' },
    ],
  },
  {
    title: 'Outdoors',
    items: [{ key: 'terrace', label: 'Terrace' }],
  },
  {
    title: 'Room amenities',
    items: [{ key: 'roomAmenities', label: 'Room amenities' }],
  },
  {
    title: 'Media & Technology',
    items: [{ key: 'flatScreenTv', label: 'Flat-screen TV' }],
  },
  {
    title: 'Internet',
    items: [{ key: 'freeWifi', label: 'WiFi is available in all areas and is free of charge.' }],
  },
  {
    title: 'Parking',
    items: [{ key: 'parking', label: 'Parking available' }],
  },
  {
    title: 'Services',
    items: [
      { key: 'wakeUpService', label: 'Wake-up service' },
      { key: 'frontDesk24Hours', label: '24-hour front desk' },
    ],
  },
  {
    title: 'General',
    items: [
      { key: 'fan', label: 'Fan' },
      { key: 'nonSmokingThroughout', label: 'Non-smoking throughout' },
    ],
  },
  {
    title: 'Languages spoken',
    items: [
      { key: 'english', label: 'English' },
      { key: 'hindi', label: 'Hindi' },
    ],
  },
];

export const defaultStayFacilities = Object.fromEntries(
  stayFacilityGroups.flatMap((group) => group.items.map((item) => [item.key, true])),
) as Record<string, boolean>;
