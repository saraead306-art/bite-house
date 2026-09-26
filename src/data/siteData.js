export const branches = [
  {
    id: 'downtown',
    name: 'فرع وسط البلد',
    address: 'شارع التحرير، بجوار السينما',
  },
  {
    id: 'new-city',
    name: 'فرع المدينة الجديدة',
    address: 'الممشى الرئيسي، بوابة 2',
  },
];

// =====================================================
// أقسام المنيو الأساسية
// نفس الأقسام المستخدمة في السيرفر والـ Dashboard
// =====================================================

export const categories = [
  {
    id: 'beef',
    label: 'برجر لحمة',
    englishName: 'Beef Burgers',
    sortOrder: 1,
  },
  {
    id: 'chicken',
    label: 'برجر فراخ',
    englishName: 'Chicken Burgers',
    sortOrder: 2,
  },
  {
    id: 'meals',
    label: 'الوجبات',
    englishName: 'Meals',
    sortOrder: 3,
  },
  {
    id: 'sides',
    label: 'المقبلات',
    englishName: 'Sides',
    sortOrder: 4,
  },
  {
    id: 'drinks',
    label: 'المشروبات',
    englishName: 'Drinks',
    sortOrder: 5,
  },
];

// =====================================================
// Empty forms
// =====================================================

export const emptyCategory = {
  label: '',
  englishName: '',
};

export const emptyProduct = {
  name: '',
  nameAr: '',
  description: '',
  category: 'beef',
  price: '',
  largePrice: '',
  badge: '',
  emoji: '🍔',
  image: '',
  isAvailable: true,
};


export const emptyOffer = {
  title: '',
  description: '',
  image: '',
  productIds: [],
  discountType: 'percentage',
  discountValue: 10,
  isActive: true,
};

// =====================================================
// Helpers
// =====================================================

export const getCategoryLabel = (
  categoryId,
  categoryList = categories
) => {
  return (
    categoryList.find(
      (category) =>
        category.id === categoryId
    )?.label || ''
  );
};

export const getBranchEnglishName = (
  branchId
) => {
  return branchId === 'downtown'
    ? 'Downtown Branch'
    : 'New City Branch';
};