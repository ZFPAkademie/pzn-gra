/**
 * Apartment images mapping from Supabase Storage
 * Bucket: apartmany
 * 
 * Řazení: 1) Interiér (fotky apartmánu), 2) Exteriér (budova), 3) Půdorysy (PNG)
 */

const SUPABASE_STORAGE_URL = 'https://nudiugowvzflokflcokd.supabase.co/storage/v1/object/public/apartmany';

/**
 * Kategorizuje a řadí obrázky podle typu
 * Priorita: interiér JPG → exteriér JPG → půdorysy PNG
 */
function sortImages(images: string[]): string[] {
  const interior: string[] = [];
  const exterior: string[] = [];
  const floorplans: string[] = [];
  
  for (const img of images) {
    const filename = img.split('/').pop() || '';
    const isPng = filename.endsWith('.png');
    
    if (isPng) {
      // PNG = půdorysy na konec
      floorplans.push(img);
    } else if (
      filename.includes('27e65d_') || // hlavní fotky interiéru
      filename.includes('postel') ||
      filename.includes('kuchyn') ||
      filename.includes('loznic') ||
      filename.includes('koupeln') ||
      filename.includes('obyvak')
    ) {
      // Interiér - na začátek
      interior.push(img);
    } else if (
      filename.includes('13bb21839b53') || // budova zvenku (opakuje se)
      filename.includes('a88334def7fe') || // exteriér
      filename.includes('f64e8463e498') || // exteriér
      filename.includes('b6f1acfdaa90')    // exteriér
    ) {
      // Exteriér - doprostřed
      exterior.push(img);
    } else {
      // Ostatní JPG - považujeme za interiér
      interior.push(img);
    }
  }
  
  return [...interior, ...exterior, ...floorplans];
}

// Raw images by folder (seřazené)
export const APARTMENT_IMAGES_BY_FOLDER: Record<string, string[]> = {
  "chata1_apartman-7_1kk_38m2": sortImages([
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/01_27e65d_a6cf6b9857e94.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/01_38c5f5789b86.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/02_27e65d_f0dc9c95c73c4.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/02_6bde29a3d134.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/03_b67c27bc3970.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/05_037c38fa440e.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/06_05ad62303b18.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/07_13bb21839b53.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/08_9d8f012f82a5.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/09_apartmany-krkonose-spindleruv-mlyn-posteljpg.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/10_a88334def7fe.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/11_b6f1acfdaa90.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/13_apartmany-krkonose-spindleruv-mlyn-prodej-labska-kuchynejpg.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-7_1kk_38m2/14_f64e8463e498.jpg`,
  ]),
  "chata1_apartman-9_2kk_62m2": sortImages([
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/01_27e65d_05ad62303b184.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/01_38c5f5789b86.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/02_27e65d_f0dc9c95c73c4.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/02_6bde29a3d134.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/03_b2debc190c07.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/05_037c38fa440e.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/06_apartmany-krkonose-spindleruv-mlyn-prodej-labska-loznicejpg.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/07_13bb21839b53.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/08_9d8f012f82a5.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/09_a6cf6b9857e9.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/10_a88334def7fe.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/11_b6f1acfdaa90.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/13_apartmany-krkonose-spindleruv-mlyn-prodej-labska-kuchynejpg.jpg`,
    `${SUPABASE_STORAGE_URL}/chata1_apartman-9_2kk_62m2/14_f64e8463e498.jpg`,
  ]),
  "chata2_apartman-11_1kk_35m2": sortImages([
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/01_27e65d_1b7edee6d1b34.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/01_4f62958a8992.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/02_27e65d_a3a7a4b293894.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/02_7f367bc5e571.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/03_cec79c4b4000.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/05_13bb21839b53.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/06_1b7edee6d1b3.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/07_1f5bef0405bb.png`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/08_258522294d6d.png`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/09_58ea799fd959.png`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/10_66ee16b71f16.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/11_8cc273c60a7e.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/12_a3a7a4b29389.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/13_a88334def7fe.jpg`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/15_f5233a09512b.png`,
    `${SUPABASE_STORAGE_URL}/chata2_apartman-11_1kk_35m2/16_f64e8463e498.jpg`,
  ]),
  "golden-ridge_apartman-1": sortImages([
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/01_27e65d_5a9d448190b94.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/01_4f62958a8992.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/02_27e65d_6983f44f7b094.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/02_c313797adfc2.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/04_0a8ddc25620e.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/05_0b56008aef45.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/06_0dc75879ae4f.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/07_13bb21839b53.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/08_14f2acd3badb.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/09_27dcff1dcb35.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/10_349872845406.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/11_53e96f9f53c7.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/12_5a9d448190b9.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/13_6983f44f7b09.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/14_79c3bb1bb39e.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/15_7c649e556f90.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-1/19_a88334def7fe.jpg`,
  ]),
  "golden-ridge_apartman-2": sortImages([
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/01_10653d14fbdf.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/01_27e65d_9271a1e203d04.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/02_27e65d_d371261724be4.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/02_4f62958a8992.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/03_c313797adfc2.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/05_13bb21839b53.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/06_5a9d448190b9.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/07_9271a1e203d0.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/08_a7865dc6fca2.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/09_a88334def7fe.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/10_bc17f60e20e4.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/11_c1397e33bcdf.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/13_d371261724be.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-2/15_f64e8463e498.jpg`,
  ]),
  "golden-ridge_apartman-3": sortImages([
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/01_27e65d_05ef23bb21724.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/01_4f62958a8992.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/02_27e65d_cd8b3cb025214.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/02_bcadd221a5e4.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/03_c313797adfc2.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/05_05ef23bb2172.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/06_115530a3446a.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/07_13bb21839b53.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/08_1ba3b2bd145e.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/09_231a880c7807.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/10_28d57600c24a.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/16_a88334def7fe.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-3/22_f64e8463e498.jpg`,
  ]),
  "golden-ridge_apartman-4": sortImages([
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/01_27e65d_a6cf6b9857e94.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/01_4f62958a8992.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/02_27e65d_f0dc9c95c73c4.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/02_5b5dd6f1dbb5.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/03_c313797adfc2.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/05_037c38fa440e.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/06_05ad62303b18.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/07_0bef0be0e941.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/08_13bb21839b53.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/14_9d8f012f82a5.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/15_a6cf6b9857e9.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/16_a88334def7fe.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-4/22_f64e8463e498.jpg`,
  ]),
  "golden-ridge_apartman-8": sortImages([
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/01_27e65d_8f04ba06ef224.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/02_0faf221239a4.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/02_27e65d_a03bb4098e2e4.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/03_16057bb13855.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/04_2d5f15f6198f.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/05_3f371526548f.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/06_4635949f3df3.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/07_476d4b173fce.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/08_4819b3bcd8de.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/09_4b5cdb515320.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/10_4c477a6649df.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/17_8f04ba06ef22.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-8/23_a03bb4098e2e.png`,
  ]),
  "golden-ridge_apartman-9": sortImages([
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/01_27e65d_1dbb2a8e09894.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/02_1360dc9afb36.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/02_27e65d_234790752eb14.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/03_1afea4cad499.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/04_1dbb2a8e0989.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/05_1f6f1da10679.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/06_20bf4f0e2b13.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/07_234790752eb1.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/08_291f077af555.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/09_29a0607f9a87.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-9/10_3e00fb2ab31a.png`,
  ]),
  "golden-ridge_apartman-11": sortImages([
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/01_27e65d_1f5bef0405bb4.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/02_1360dc9afb36.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/02_27e65d_58ea799fd9594.jpg`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/03_1f5bef0405bb.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/04_258522294d6d.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/05_28469e8c83db.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/06_2964522a5827.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/07_359ef74bef55.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/08_36f5c0681d51.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/09_382f4c45ac8b.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/10_3e00fb2ab31a.png`,
    `${SUPABASE_STORAGE_URL}/golden-ridge_apartman-11/25_f09a77728a0d.jpg`,
  ]),
};

// Mapping slugs to image folders
const SLUG_TO_FOLDER: Record<string, string> = {
  // Prodej (chata) - tyto složky jsou sdílené s pronájmem
  'chata-1-suite-7': 'chata1_apartman-7_1kk_38m2',
  'chata-1-suite-9': 'chata1_apartman-9_2kk_62m2',
  'chata-2-suite-11': 'chata2_apartman-11_1kk_35m2',
  // Pronájem - sdílené s prodejními chata apartmány
  'golden-ridge-7': 'chata1_apartman-7_1kk_38m2',
  'golden-ridge-9': 'chata1_apartman-9_2kk_62m2',
  'golden-ridge-11': 'chata2_apartman-11_1kk_35m2',
  // Pronájem - vlastní Golden Ridge fotky
  'golden-ridge-1': 'golden-ridge_apartman-1',
  'golden-ridge-2': 'golden-ridge_apartman-2',
  'golden-ridge-3': 'golden-ridge_apartman-3',
  'golden-ridge-4': 'golden-ridge_apartman-4',
  'golden-ridge-8': 'golden-ridge_apartman-8',
};

/**
 * Get all images for an apartment by slug (already sorted)
 */
export function getApartmentImages(slug: string): string[] {
  const folder = SLUG_TO_FOLDER[slug];
  if (!folder) return [];
  return APARTMENT_IMAGES_BY_FOLDER[folder] || [];
}

/**
 * Get the main (hero) image for an apartment
 */
export function getApartmentHeroImage(slug: string): string | null {
  const images = getApartmentImages(slug);
  return images[0] || null;
}

/**
 * Get thumbnail images (first N) for grid display
 */
export function getApartmentThumbnails(slug: string, count = 4): string[] {
  const images = getApartmentImages(slug);
  return images.slice(0, count);
}
