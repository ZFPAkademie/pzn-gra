/**
 * Mock Data - Apartments
 * Shared mock data for development without database
 * 
 * Sprint 3: Development mock dataset
 */

export interface MockApartment {
  id: string;
  number: number;
  name: string;
  slug: string;
  status: 'FOR_RENT' | 'FOR_SALE' | 'SOLD';
  rentalEnabled: boolean;
  descriptionCs: string;
  descriptionEn: string;
  photos: string[];
  amenities: string[];
  capacity: number;
  sizeSqm: number;
  basePriceEur: number;
}

export const MOCK_APARTMENTS: MockApartment[] = [
  {
    id: 'apt-1',
    number: 1,
    name: 'Apartmán 1',
    slug: 'apartman-1',
    status: 'FOR_RENT',
    rentalEnabled: true,
    descriptionCs: 'Útulný apartmán s výhledem na hory. Ideální pro páry hledající romantický únik do přírody. Apartmán nabízí moderní vybavení, plně zařízenou kuchyni a pohodlnou postel s kvalitní matrací. Z balkonu se můžete kochat panoramatickým výhledem na okolní kopce.',
    descriptionEn: 'Cozy apartment with mountain views. Ideal for couples seeking a romantic nature escape. The apartment offers modern amenities, a fully equipped kitchen, and a comfortable bed with a quality mattress. From the balcony, you can enjoy panoramic views of the surrounding hills.',
    photos: ['/images/apartments/apt-1-1.jpg', '/images/apartments/apt-1-2.jpg'],
    amenities: ['wifi', 'parking', 'kitchen', 'tv', 'balcony'],
    capacity: 2,
    sizeSqm: 45,
    basePriceEur: 120,
  },
  {
    id: 'apt-2',
    number: 2,
    name: 'Apartmán 2',
    slug: 'apartman-2',
    status: 'FOR_RENT',
    rentalEnabled: true,
    descriptionCs: 'Prostorný apartmán pro rodiny. Dvě ložnice a plně vybavená kuchyně umožňují pohodlný pobyt pro celou rodinu. Obývací pokoj s pohovkou nabízí prostor pro společné chvíle.',
    descriptionEn: 'Spacious family apartment. Two bedrooms and fully equipped kitchen allow comfortable stay for the whole family. Living room with sofa offers space for time together.',
    photos: ['/images/apartments/apt-2-1.jpg', '/images/apartments/apt-2-2.jpg'],
    amenities: ['wifi', 'parking', 'kitchen', 'tv', 'washer'],
    capacity: 4,
    sizeSqm: 75,
    basePriceEur: 180,
  },
  {
    id: 'apt-3',
    number: 3,
    name: 'Apartmán 3',
    slug: 'apartman-3',
    status: 'FOR_RENT',
    rentalEnabled: true,
    descriptionCs: 'Luxusní apartmán s terasou. Perfektní pro ty, kteří oceňují extra prostor a soukromí. Velká terasa je ideální pro ranní kávu s výhledem na hory.',
    descriptionEn: 'Luxury apartment with terrace. Perfect for those who appreciate extra space and privacy. Large terrace is ideal for morning coffee with mountain views.',
    photos: ['/images/apartments/apt-3-1.jpg', '/images/apartments/apt-3-2.jpg'],
    amenities: ['wifi', 'parking', 'kitchen', 'tv', 'washer', 'terrace'],
    capacity: 6,
    sizeSqm: 95,
    basePriceEur: 250,
  },
  {
    id: 'apt-5',
    number: 5,
    name: 'Apartmán 5',
    slug: 'apartman-5',
    status: 'FOR_RENT',
    rentalEnabled: true,
    descriptionCs: 'Moderní studio s panoramatickým výhledem. Kompaktní, ale plně vybavený prostor pro páry nebo jednotlivce.',
    descriptionEn: 'Modern studio with panoramic views. Compact but fully equipped space for couples or individuals.',
    photos: ['/images/apartments/apt-5-1.jpg'],
    amenities: ['wifi', 'parking', 'kitchen', 'tv'],
    capacity: 2,
    sizeSqm: 38,
    basePriceEur: 100,
  },
  {
    id: 'apt-7',
    number: 7,
    name: 'Apartmán 7',
    slug: 'apartman-7',
    status: 'FOR_RENT',
    rentalEnabled: true,
    descriptionCs: 'Rodinný apartmán s dětským koutkem. Ideální pro rodiny s malými dětmi. Bezpečné prostředí a hračky pro nejmenší.',
    descriptionEn: 'Family apartment with kids corner. Ideal for families with small children. Safe environment and toys for the little ones.',
    photos: ['/images/apartments/apt-7-1.jpg', '/images/apartments/apt-7-2.jpg'],
    amenities: ['wifi', 'parking', 'kitchen', 'tv', 'washer', 'kids-friendly'],
    capacity: 5,
    sizeSqm: 82,
    basePriceEur: 200,
  },
  {
    id: 'apt-9',
    number: 9,
    name: 'Apartmán 9',
    slug: 'apartman-9',
    status: 'FOR_RENT',
    rentalEnabled: true,
    descriptionCs: 'Exkluzivní penthouse s vlastní saunou. Nejvyšší standard v celém komplexu. Luxusní vybavení a soukromá sauna pro maximální relaxaci.',
    descriptionEn: 'Exclusive penthouse with private sauna. The highest standard in the entire complex. Luxury amenities and private sauna for maximum relaxation.',
    photos: ['/images/apartments/apt-9-1.jpg', '/images/apartments/apt-9-2.jpg'],
    amenities: ['wifi', 'parking', 'kitchen', 'tv', 'washer', 'sauna', 'terrace'],
    capacity: 8,
    sizeSqm: 120,
    basePriceEur: 350,
  },
  {
    id: 'apt-12',
    number: 12,
    name: 'Apartmán 12',
    slug: 'apartman-12',
    status: 'FOR_RENT',
    rentalEnabled: true,
    descriptionCs: 'Útulný apartmán v přízemí s přímým přístupem na zahradu. Ideální pro hosty se psy nebo ty, kteří preferují snadný přístup.',
    descriptionEn: 'Cozy ground floor apartment with direct garden access. Ideal for guests with dogs or those who prefer easy access.',
    photos: ['/images/apartments/apt-12-1.jpg'],
    amenities: ['wifi', 'parking', 'kitchen', 'tv', 'garden', 'pet-friendly'],
    capacity: 4,
    sizeSqm: 65,
    basePriceEur: 160,
  },
  {
    id: 'apt-15',
    number: 15,
    name: 'Apartmán 15',
    slug: 'apartman-15',
    status: 'FOR_RENT',
    rentalEnabled: true,
    descriptionCs: 'Apartmán s pracovním koutem. Ideální pro digital nomády a vzdálené pracovníky. Ergonomické pracovní místo a rychlé WiFi.',
    descriptionEn: 'Apartment with work corner. Ideal for digital nomads and remote workers. Ergonomic workspace and fast WiFi.',
    photos: ['/images/apartments/apt-15-1.jpg'],
    amenities: ['wifi', 'parking', 'kitchen', 'tv', 'workspace'],
    capacity: 3,
    sizeSqm: 55,
    basePriceEur: 140,
  },
  {
    id: 'apt-18',
    number: 18,
    name: 'Apartmán 18',
    slug: 'apartman-18',
    status: 'FOR_RENT',
    rentalEnabled: true,
    descriptionCs: 'Romantický apartmán s krbem. Perfektní pro zimní víkendy. Atmosféra přímo vybízí k odpočinku u ohně.',
    descriptionEn: 'Romantic apartment with fireplace. Perfect for winter weekends. The atmosphere invites you to relax by the fire.',
    photos: ['/images/apartments/apt-18-1.jpg', '/images/apartments/apt-18-2.jpg'],
    amenities: ['wifi', 'parking', 'kitchen', 'tv', 'fireplace'],
    capacity: 2,
    sizeSqm: 50,
    basePriceEur: 150,
  },
  {
    id: 'apt-21',
    number: 21,
    name: 'Apartmán 21',
    slug: 'apartman-21',
    status: 'FOR_RENT',
    rentalEnabled: true,
    descriptionCs: 'Velký rodinný apartmán se třemi ložnicemi. Prostor pro celou rodinu nebo skupinu přátel. Prostorná kuchyně a obývací pokoj.',
    descriptionEn: 'Large family apartment with three bedrooms. Space for the whole family or group of friends. Spacious kitchen and living room.',
    photos: ['/images/apartments/apt-21-1.jpg', '/images/apartments/apt-21-2.jpg'],
    amenities: ['wifi', 'parking', 'kitchen', 'tv', 'washer', 'dishwasher'],
    capacity: 7,
    sizeSqm: 110,
    basePriceEur: 280,
  },
];

/**
 * Get apartments list for display
 */
export function getMockApartments(locale: 'cs' | 'en' = 'cs') {
  return MOCK_APARTMENTS
    .filter(apt => apt.rentalEnabled && apt.status === 'FOR_RENT')
    .map(apt => ({
      id: apt.id,
      number: apt.number,
      name: apt.name,
      slug: apt.slug,
      description: locale === 'cs' ? apt.descriptionCs : apt.descriptionEn,
      photos: apt.photos,
      capacity: apt.capacity,
      priceFrom: apt.basePriceEur,
    }));
}

/**
 * Get single apartment by slug
 */
export function getMockApartmentBySlug(slug: string, locale: 'cs' | 'en' = 'cs') {
  const apt = MOCK_APARTMENTS.find(a => a.slug === slug && a.rentalEnabled);
  if (!apt) return null;
  
  return {
    id: apt.id,
    number: apt.number,
    name: apt.name,
    slug: apt.slug,
    description: locale === 'cs' ? apt.descriptionCs : apt.descriptionEn,
    photos: apt.photos,
    amenities: apt.amenities,
    capacity: apt.capacity,
    sizeSqm: apt.sizeSqm,
    priceFrom: apt.basePriceEur,
    maxGuests: apt.capacity,
    basePricePerNight: apt.basePriceEur,
  };
}

/**
 * Get apartment by ID (for booking)
 */
export function getMockApartmentById(id: string) {
  return MOCK_APARTMENTS.find(a => a.id === id && a.rentalEnabled);
}
