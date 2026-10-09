const STORAGE_KEY = 'bite-house-products-v2';

const defaultProducts = [
  {
    id: 1,
    name: 'Golden Burger',
    nameAr: 'جولدن برجر',
    description: 'برجر لحم بصوص الجولدن، خس، وصوص البيت في عيش طازج.',
    category: 'beef',
    price: 135,
    sizes: [135, 170],
    badge: 'الأكثر طلبًا',
    emoji: '🍔',
    image: 'https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/golden.webp',
    isAvailable: true,
  },
  {
    id: 2,
    name: 'Nest Burger',
    nameAr: 'نست برجر',
    description: 'برجر لحم، طبقة مقرمشة، جبنة وصوصات البيت.',
    category: 'beef',
    price: 175,
    sizes: [175, 205],
    badge: 'جديد',
    emoji: '🍔',
    image: 'https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/nest.webp',
    isAvailable: true,
  },
  {
    id: 3,
    name: 'Old School',
    nameAr: 'اولد سكول',
    description: 'الطعم الكلاسيك اللي عمره ما بيبطل يتطلب.',
    category: 'beef',
    price: 125,
    sizes: [125, 135],
    badge: 'قيمة حلوة',
    emoji: '🍔',
    image: 'https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/old.webp',
    isAvailable: true,
  },
  {
    id: 4,
    name: 'Mushroom Bacon',
    nameAr: 'مشروم بيكون',
    description: 'مشروم سوتيه، بيكون، جبنة وصوص كريمي غني.',
    category: 'beef',
    price: 185,
    sizes: [185, 215],
    badge: '',
    emoji: '🍔',
    image: 'https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/mushroom-bacon.webp',
    isAvailable: true,
  },
  {
    id: 5,
    name: 'Bacon Burger',
    nameAr: 'بيكون برجر',
    description: 'بيكون مقرمش مع جبنة وصوص البيت فوق برجر اللحم.',
    category: 'beef',
    price: 135,
    sizes: [135, 175],
    badge: '',
    emoji: '🍔',
    image: 'https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/bacon.webp',
    isAvailable: true,
  },
  {
    id: 6,
    name: 'Gladiator',
    nameAr: 'جليداتور',
    description: 'ساندوتش ضخم بطبقات غنية ومذاق قوي.',
    category: 'beef',
    price: 195,
    sizes: [195],
    badge: '',
    emoji: '🍔',
    image: 'https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/gladiator.webp',
    isAvailable: true,
  },
  {
    id: 7,
    name: 'Mushroom',
    nameAr: 'مشروم برجر',
    description: 'برجر لحم مع مشروم وصوص كريمي وجبنة.',
    category: 'beef',
    price: 145,
    sizes: [145, 175],
    badge: '',
    emoji: '🍔',
    image: 'https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/mushroom.webp',
    isAvailable: true,
  },
  {
    id: 8,
    name: 'Volcano',
    nameAr: 'فولكانو',
    description: 'جبنة سايحة وصوص غني بيعمل الانفجار الصح.',
    category: 'beef',
    price: 160,
    sizes: [160],
    badge: '',
    emoji: '🍔',
    image: 'https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/volcano.webp',
    isAvailable: true,
  },
  {
    id: 9,
    name: 'Nest Royal',
    nameAr: 'نست رويال',
    description: 'اختيار رايق بطعم متوازن وصوص البيت.',
    category: 'beef',
    price: 110,
    sizes: [110, 135],
    badge: 'اقتصادي',
    emoji: '🍔',
    image: 'https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/nest-royal.webp',
    isAvailable: true,
  },
  {
    id: 10,
    name: 'Double Burger',
    nameAr: 'دبل برجر',
    description: 'دبل لحمة ودبل جبنة لمحبي الوجبات التقيلة.',
    category: 'beef',
    price: 175,
    sizes: [175, 210],
    badge: '',
    emoji: '🍔',
    image: 'https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/double.webp',
    isAvailable: true,
  },
];

export function loadProducts() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore localStorage errors and return defaults.
  }
  return defaultProducts;
}

export function saveProducts(products) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // Ignore localStorage errors.
  }
}
