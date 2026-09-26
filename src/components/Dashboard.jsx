import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  Edit3,
  FolderPlus,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  PackagePlus,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

import BranchMultiSelect from './BranchMultiSelect';
import ThemeToggle from './ThemeToggle';


const TABS = [
  {
    id: 'overview',
    label: 'نظرة عامة',
    icon: LayoutDashboard,
  },
  {
    id: 'branches',
    label: 'الفروع',
    icon: Building2,
  },
  {
    id: 'categories',
    label: 'الأقسام',
    icon: FolderPlus,
  },
  {
    id: 'products',
    label: 'الأصناف',
    icon: ShoppingBag,
  },
  {
    id: 'offers',
    label: 'العروض',
    icon: Sparkles,
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    icon: Settings,
  },
];

const EMPTY_CATEGORY = {
  label: '',
  englishName: '',
  branchIds: [],
};

const EMPTY_BRANCH = {
  name: '',
  englishName: '',
  address: '',
};

const EMPTY_PRODUCT = {
  name: '',
  nameAr: '',
  description: '',
  category: '',
  branchIds: [],
  price: '',
  largePrice: '',
  badge: '',
  image: '',
  imageFile: null,
  isAvailable: true,
};

const EMPTY_OFFER = {
  title: '',
  description: '',
  image: '',
  imageFile: null,
  branchIds: [],
  productIds: [],
  items: [],
  discountType: 'percentage',
  discountValue: 10,
  isActive: true,
};

const EMPTY_PASSWORD = {
  email: '',
  currentPassword: '',
  newPassword: '',
};

const EMPTY_ADMIN = {
  email: '',
  password: '',
};

async function api(
  url,
  options = {}
) {
  const response =
    await fetch(
      url,
      {
        credentials: 'include',
        cache: 'no-store',
        ...options,
        headers: {
          'Content-Type':
            'application/json',
          ...(options.headers ||
            {}),
        },
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    const error =
      new Error(
        data.message ||
          'حدث خطأ غير متوقع.'
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}

function money(
  value
) {
  return Number(
    value || 0
  ).toLocaleString(
    'en-EG'
  );
}

function normalizeId(value) {
  return String(value ?? '').trim();
}

function getProductCategoryId(product) {
  return normalizeId(
    product?.category ?? product?.categoryId
  );
}

function normalizeProduct(
  product
) {
  return {
    name:
      product?.name ?? '',

    nameAr:
      product?.nameAr ?? '',

    description:
      product?.description ?? '',

    category:
      product?.category ?? '',

    branchIds:
      Array.isArray(product?.branchIds)
        ? product.branchIds.map(String)
        : [],

    price:
      product?.price ?? '',

    largePrice:
      product?.largePrice ?? '',

    badge:
      product?.badge ?? '',

    image:
      product?.image ?? '',

    imageFile:
      null,

    isAvailable:
      product?.isAvailable !==
      false,
  };
}

function normalizeOffer(
  offer
) {
  return {
    title:
      offer?.title ?? '',

    description:
      offer?.description ?? '',

    image:
      offer?.image ?? '',

    imageFile:
      null,

    branchIds:
      Array.isArray(offer?.branchIds)
        ? offer.branchIds.map(String)
        : [],

    productIds:
      Array.isArray(
        offer?.productIds
      )
        ? offer.productIds.map(
            Number
          )
        : [],

    items:
      Array.isArray(offer?.items)
        ? offer.items
            .map((item) => ({
              productId: Number(item?.productId),
              size:
                item?.size === 'L'
                  ? 'L'
                  : 'M',
              quantity: Math.max(
                1,
                Number(item?.quantity) || 1
              ),
            }))
            .filter((item) =>
              Number.isFinite(item.productId)
            )
        : [],

    discountType:
      offer?.discountType ===
      'fixed'
        ? 'fixed'
        : 'percentage',

    discountValue:
      offer?.discountValue ??
      10,

    isActive:
      offer?.isActive !==
      false,
  };
}

function ImageField({
  label,
  value,
  file,
  onFile,
  onClear,
}) {
  const [
    preview,
    setPreview,
  ] = useState(
    value || ''
  );

  useEffect(() => {
    if (!file) {
      setPreview(
        value || ''
      );

      return undefined;
    }

    const objectUrl =
      URL.createObjectURL(
        file
      );

    setPreview(
      objectUrl
    );

    return () =>
      URL.revokeObjectURL(
        objectUrl
      );
  }, [
    file,
    value,
  ]);

  return (
    <div className="image-field">
      <div className="image-field-head">
        <strong>
          {label}
        </strong>

        <span>
          PNG / JPG / WebP · حتى 6MB
        </span>
      </div>

      <label className="upload-dropzone">
        {preview ? (
          <>
            <img
              src={preview}
              alt="معاينة"
            />

            <span className="upload-overlay">
              <ImagePlus
                size={13}
              />

              تغيير الصورة
            </span>
          </>
        ) : (
          <span className="upload-empty">
            <ImagePlus
              size={26}
            />

            <strong>
              اختاري صورة
            </strong>

            <small>
              من جهازك
            </small>
          </span>
        )}

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            onFile(
              event.target
                .files?.[0] ||
                null
            );

            event.target.value =
              '';
          }}
        />
      </label>

      {preview && (
        <button
          type="button"
          className="clear-image"
          onClick={
            onClear
          }
        >
          <X size={13} />
          إزالة الصورة
        </button>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}) {
  return (
    <article className="dashboard-stat">
      <span className="dashboard-stat-icon">
        <Icon size={19} />
      </span>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {hint}
        </small>
      </div>
    </article>
  );
}

export default function Dashboard({
  data,
  onDataChange,
  onLogout,
  dataLoading = false,
}) {
  const branches =
    Array.isArray(
      data?.branches
    )
      ? data.branches
      : [];

  const categories =
    Array.isArray(
      data?.categories
    )
      ? data.categories
      : [];

  const products =
    Array.isArray(
      data?.products
    )
      ? data.products
      : [];

  const offers =
    Array.isArray(
      data?.offers
    )
      ? data.offers
      : [];

  const currentAdminEmail =
    data?.currentAdminEmail ||
    '';

  const adminEmails =
    Array.isArray(
      data?.adminEmails
    )
      ? data.adminEmails
      : [];

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    'overview'
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    notice,
    setNotice,
  ] = useState({
    type: '',
    text: '',
  });

  const [
    branchForm,
    setBranchForm,
  ] = useState({
    ...EMPTY_BRANCH,
  });

  const [
    categoryForm,
    setCategoryForm,
  ] = useState({
    ...EMPTY_CATEGORY,
  });

  const [
    editingCategoryId,
    setEditingCategoryId,
  ] = useState(null);

  const [
    productForm,
    setProductForm,
  ] = useState({
    ...EMPTY_PRODUCT,
  });

  const [
    editingProductId,
    setEditingProductId,
  ] = useState(null);

  const [
    productSearch,
    setProductSearch,
  ] = useState('');

  const [
    productFilter,
    setProductFilter,
  ] = useState('all');

  const [
    offerForm,
    setOfferForm,
  ] = useState({
    ...EMPTY_OFFER,
    productIds: [],
    items: [],
  });

  const [
    editingOfferId,
    setEditingOfferId,
  ] = useState(null);

  const [
    expandedOfferSections,
    setExpandedOfferSections,
  ] = useState([]);

  const [
    passwordForm,
    setPasswordForm,
  ] = useState({
    ...EMPTY_PASSWORD,
    email:
      currentAdminEmail,
  });

  const [
    newAdminForm,
    setNewAdminForm,
  ] = useState({
    ...EMPTY_ADMIN,
  });

  useEffect(() => {
    setPasswordForm(
      (current) => ({
        ...current,

        email:
          currentAdminEmail ||
          current.email ||
          '',
      })
    );
  }, [
    currentAdminEmail,
  ]);

  const filteredProducts =
    useMemo(() => {
      const search =
        productSearch
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchesCategory =
            productFilter ===
              'all' ||
            product.category ===
              productFilter;

          const text =
            `${product.name || ''} ${
              product.nameAr || ''
            } ${
              product.description ||
              ''
            }`.toLowerCase();

          return (
            matchesCategory &&
            (!search ||
              text.includes(
                search
              ))
          );
        }
      );
    }, [
      products,
      productSearch,
      productFilter,
    ]);

  const selectedOfferBranchIds =
    useMemo(() => {
      return Array.isArray(offerForm.branchIds)
        ? offerForm.branchIds
            .map(normalizeId)
            .filter(Boolean)
        : [];
    }, [offerForm.branchIds]);

  function productMatchesCategory(product, category) {
    const productCategoryId = normalizeId(
      product?.category ?? product?.categoryId
    );

    const categoryId = normalizeId(
      category?.id ?? category?.categoryId
    );

    return Boolean(categoryId) &&
      productCategoryId === categoryId;
  }

  function productIsAvailableForOfferBranches(product) {
    if (!selectedOfferBranchIds.length) {
      // قبل اختيار الفروع، اعرضي الأصناف بدل ما تظهر الأقسام فاضية.
      // التحقق النهائي من الفروع بيتم وقت الحفظ في submitOffer والـAPI.
      return product?.isAvailable !== false;
    }

    const productBranchIds = Array.isArray(product?.branchIds)
      ? product.branchIds
          .map(normalizeId)
          .filter(Boolean)
      : [];

    const productCategory = categories.find((category) =>
      productMatchesCategory(product, category)
    );

    const categoryBranchIds = Array.isArray(
      productCategory?.branchIds
    )
      ? productCategory.branchIds
          .map(normalizeId)
          .filter(Boolean)
      : [];

    const effectiveBranchIds = productBranchIds.length
      ? productBranchIds
      : categoryBranchIds.length
        ? categoryBranchIds
        : branches.map((branch) => normalizeId(branch.id));

    return (
      product?.isAvailable !== false &&
      selectedOfferBranchIds.some((branchId) =>
        effectiveBranchIds.includes(branchId)
      )
    );
  }

  const availableOfferProducts =
    useMemo(() => {
      return products.filter((product) =>
        productIsAvailableForOfferBranches(product)
      );
    }, [
      products,
      categories,
      branches,
      selectedOfferBranchIds,
    ]);

  function getOfferProductById(id) {
    return products.find(
      (product) =>
        Number(product.id) === Number(id)
    );
  }

  function getDefaultOfferSize(product) {
    if (product?.price !== '' && product?.price != null) {
      return 'M';
    }

    if (product?.largePrice !== '' && product?.largePrice != null) {
      return 'L';
    }

    return 'M';
  }

  function getOfferUnitPrice(product, size) {
    if (!product) {
      return 0;
    }

    const requested =
      size === 'L'
        ? product.largePrice
        : product.price;

    if (requested !== '' && requested != null) {
      return Number(requested) || 0;
    }

    // لو الحجم المختار مش موجود، استخدم السعر المتاح بدل ما العرض يبقى بصفر.
    const fallback =
      size === 'L'
        ? product.price
        : product.largePrice;

    return Number(fallback) || 0;
  }

  const offerItems =
    useMemo(() => {
      const rawItems = Array.isArray(offerForm.items)
        ? offerForm.items
        : [];

      return rawItems
        .map((item) => {
          const product = getOfferProductById(item.productId);

          if (!product) {
            return null;
          }

          const size =
            item.size === 'L'
              ? 'L'
              : 'M';

          return {
            ...item,
            product,
            size,
            quantity: Math.max(1, Number(item.quantity) || 1),
            unitPrice: getOfferUnitPrice(product, size),
          };
        })
        .filter(Boolean);
    }, [offerForm.items, products]);

  const selectedOfferProducts = offerItems.map(
    (item) => item.product
  );

  const offerSubtotal =
    offerItems.reduce(
      (sum, item) =>
        sum +
        item.unitPrice *
          item.quantity,
      0
    );

  const generatedOfferDescription =
    offerItems.length
      ? offerItems
          .map(
            (item) =>
              `${item.quantity} × ${
                item.product.nameAr ||
                item.product.name ||
                'صنف'
              } (${item.size})`
          )
          .join(' + ')
      : '';

  const discountValue = Math.max(
    0,
    Number(offerForm.discountValue) || 0
  );

  const offerDiscount =
    offerForm.discountType ===
    'percentage'
      ? (
          offerSubtotal *
          Math.min(
            discountValue,
            100
          )
        ) /
        100
      : Math.min(
          discountValue,
          offerSubtotal
        );

  const offerFinal =
    Math.max(
      0,
      offerSubtotal -
        offerDiscount
    );

  const activeProductsCount =
    products.filter(
      (product) =>
        product.isAvailable !==
        false
    ).length;

  const activeOffersCount =
    offers.filter(
      (offer) =>
        offer.isActive !==
        false
    ).length;

  const currentTab =
    TABS.find(
      (tab) =>
        tab.id ===
        activeTab
    ) || TABS[0];

  function notify(
    type,
    text
  ) {
    setNotice({
      type,
      text,
    });

    window.clearTimeout(
      notify.timer
    );

    notify.timer =
      window.setTimeout(
        () => {
          setNotice({
            type: '',
            text: '',
          });
        },
        3500
      );
  }

  function changeTab(
    tab
  ) {
    setActiveTab(tab);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function resetBranch() {
    setBranchForm({ ...EMPTY_BRANCH });
  }

  async function submitBranch(event) {
    event.preventDefault();

    const name = String(branchForm.name ?? '').trim();
    const englishName = String(branchForm.englishName ?? '').trim();
    const address = String(branchForm.address ?? '').trim();

    if (!name || !address) {
      notify('error', 'اكتبي اسم الفرع والعنوان.');
      return;
    }

    setLoading(true);

    try {
      await api('/api/admin/branches', {
        method: 'POST',
        body: JSON.stringify({ name, englishName, address }),
      });
      await onDataChange();
      resetBranch();
      notify('success', 'تمت إضافة الفرع بنجاح.');
    } catch (error) {
      notify('error', error.message);
    } finally {
      setLoading(false);
    }
  }

  function resetCategory() {
    setCategoryForm({
      ...EMPTY_CATEGORY,
    });

    setEditingCategoryId(
      null
    );
  }

  function resetProduct() {
    setProductForm({
      ...EMPTY_PRODUCT,
    });

    setEditingProductId(
      null
    );
  }

  function resetOffer() {
    setOfferForm({
      ...EMPTY_OFFER,
      productIds: [],
      items: [],
    });

    setEditingOfferId(
      null
    );

    setExpandedOfferSections(
      []
    );
  }

  async function submitCategory(
    event
  ) {
    event.preventDefault();

    const label =
      String(
        categoryForm.label ??
          ''
      ).trim();

    const englishName =
      String(
        categoryForm.englishName ??
          ''
      ).trim();

    if (!label) {
      notify(
        'error',
        'اكتبي اسم القسم.'
      );

      return;
    }

    if (!categoryForm.branchIds?.length) {
      notify('error', 'اختاري فرعًا واحدًا على الأقل للقسم.');
      return;
    }

    setLoading(true);

    try {
      const wasEditing =
        Boolean(
          editingCategoryId
        );

      await api(
        wasEditing
          ? `/api/admin/categories/${encodeURIComponent(
              editingCategoryId
            )}`
          : '/api/admin/categories',
        {
          method:
            wasEditing
              ? 'PUT'
              : 'POST',

          body:
            JSON.stringify({
              label,
              englishName,
              branchIds: categoryForm.branchIds,
            }),
        }
      );

      await onDataChange();

      resetCategory();

      notify(
        'success',
        wasEditing
          ? 'تم تعديل القسم بنجاح.'
          : 'تمت إضافة القسم بنجاح.'
      );
    } catch (error) {
      notify(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  function editCategory(
    category
  ) {
    setEditingCategoryId(
      category.id
    );

    setCategoryForm({
      label:
        category.label ??
        '',

      englishName:
        category.englishName ??
        '',

      branchIds:
        Array.isArray(category.branchIds)
          ? category.branchIds.map(String)
          : branches.map((branch) => branch.id),
    });

    changeTab(
      'categories'
    );
  }

  async function deleteCategory(
    id
  ) {
    const category =
      categories.find(
        (item) =>
          item.id === id
      );

    const productCount =
      products.filter(
        (product) =>
          product.category ===
          id
      ).length;

    const confirmed =
      window.confirm(
        `سيتم حذف القسم "${
          category?.label ||
          ''
        }"${
          productCount
            ? ` وحذف ${productCount} صنف بداخله`
            : ''
        }. هل تريدين المتابعة؟`
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const result =
        await api(
          `/api/admin/categories/${encodeURIComponent(
            id
          )}`,
          {
            method:
              'DELETE',
          }
        );

      await onDataChange();

      notify(
        'success',
        `تم حذف القسم و${
          result.deletedProducts ||
          0
        } صنف مرتبط به.`
      );
    } catch (error) {
      notify(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(
    file
  ) {
    if (!file) {
      return '';
    }

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      throw new Error(
        'اختاري ملف صورة.'
      );
    }

    if (
      file.size >
      6 * 1024 * 1024
    ) {
      throw new Error(
        'حجم الصورة يجب ألا يتجاوز 6MB.'
      );
    }

    const dataUrl =
      await new Promise(
        (
          resolve,
          reject
        ) => {
          const reader =
            new FileReader();

          reader.onload =
            () =>
              resolve(
                String(
                  reader.result
                )
              );

          reader.onerror =
            () =>
              reject(
                new Error(
                  'تعذر قراءة الصورة.'
                )
              );

          reader.readAsDataURL(
            file
          );
        }
      );

    const result =
      await api(
        '/api/admin/upload-image',
        {
          method:
            'POST',

          body:
            JSON.stringify({
              dataUrl,
              fileName:
                file.name,
            }),
        }
      );

    return result.path ||
      '';
  }

  async function submitProduct(
    event
  ) {
    event.preventDefault();

    const name =
      String(
        productForm.name ??
          ''
      ).trim();

    const nameAr =
      String(
        productForm.nameAr ??
          ''
      ).trim();

    const rawPrice =
      String(
        productForm.price ??
          ''
      ).trim();

    const rawLargePrice =
      String(
        productForm.largePrice ??
          ''
      ).trim();

    const hasPrice =
      rawPrice !== '';

    const hasLargePrice =
      rawLargePrice !== '';

    if (
      !hasPrice &&
      !hasLargePrice
    ) {
      notify(
        'error',
        'أضيفي سعرًا واحدًا على الأقل: الصغير أو الكبير.'
      );

      return;
    }

    const price = hasPrice
      ? Number(rawPrice)
      : null;

    const largePrice =
      hasLargePrice
        ? Number(rawLargePrice)
        : null;

    if (
      !name ||
      !nameAr
    ) {
      notify(
        'error',
        'الاسم بالعربي والإنجليزي مطلوب.'
      );

      return;
    }

    if (
      !productForm.category
    ) {
      notify(
        'error',
        'اختاري القسم.'
      );

      return;
    }

    if (!productForm.branchIds?.length) {
      notify('error', 'اختاري فرعًا واحدًا على الأقل للصنف.');
      return;
    }

    const selectedCategory = categories.find(
      (category) => category.id === productForm.category
    );
    const selectedCategoryBranchIds = Array.isArray(selectedCategory?.branchIds)
      ? selectedCategory.branchIds.map(String)
      : branches.map((branch) => branch.id);

    if (productForm.branchIds.some((branchId) => !selectedCategoryBranchIds.includes(branchId))) {
      notify('error', 'الفروع المختارة للصنف لازم تكون مضافة لنفس القسم.');
      return;
    }

    if (
      hasPrice &&
      (!Number.isFinite(price) ||
        price < 0)
    ) {
      notify(
        'error',
        'السعر الصغير غير صحيح.'
      );

      return;
    }

    if (
      hasLargePrice &&
      (!Number.isFinite(largePrice) ||
        largePrice < 0)
    ) {
      notify(
        'error',
        'السعر الكبير غير صحيح.'
      );

      return;
    }

    setLoading(true);

    try {
      let image =
        productForm.image ||
        '';

      if (
        productForm.imageFile
      ) {
        image =
          await uploadImage(
            productForm.imageFile
          );
      }

      const payload = {
        name,

        nameAr,

        description:
          String(
            productForm.description ??
              ''
          ).trim(),

        category:
          productForm.category,

        branchIds:
          productForm.branchIds.map(String),

        price,

        largePrice,

        badge:
          String(
            productForm.badge ??
              ''
          ).trim(),

        image,

        isAvailable:
          productForm.isAvailable !==
          false,
      };

      const wasEditing =
        Boolean(
          editingProductId
        );

      await api(
        wasEditing
          ? `/api/admin/products/${editingProductId}`
          : '/api/admin/products',
        {
          method:
            wasEditing
              ? 'PUT'
              : 'POST',

          body:
            JSON.stringify(
              payload
            ),
        }
      );

      await onDataChange();

      resetProduct();

      notify(
        'success',
        wasEditing
          ? 'تم تعديل الصنف بنجاح.'
          : 'تمت إضافة الصنف بنجاح.'
      );
    } catch (error) {
      notify(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  function editProduct(
    product
  ) {
    setEditingProductId(
      product.id
    );

    setProductForm(
      normalizeProduct(
        product
      )
    );

    changeTab(
      'products'
    );
  }

  async function deleteProduct(
    id
  ) {
    if (
      !window.confirm(
        'هل تريدين حذف الصنف؟'
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      await api(
        `/api/admin/products/${id}`,
        {
          method:
            'DELETE',
        }
      );

      await onDataChange();

      notify(
        'success',
        'تم حذف الصنف.'
      );
    } catch (error) {
      notify(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleProduct(
    id
  ) {
    setLoading(true);

    try {
      await api(
        `/api/admin/products/${id}/toggle`,
        {
          method:
            'PATCH',
        }
      );

      await onDataChange();
    } catch (error) {
      notify(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleOfferSection(
    id
  ) {
    setExpandedOfferSections(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id
            )
          : [
              ...current,
              id,
            ]
    );
  }

  function toggleOfferProduct(id) {
    const numericId = Number(id);

    setOfferForm((current) => {
      const currentItems = Array.isArray(current.items)
        ? current.items
        : [];

      const exists = currentItems.some(
        (item) => Number(item.productId) === numericId
      );

      if (exists) {
        const items = currentItems.filter(
          (item) => Number(item.productId) !== numericId
        );

        return {
          ...current,
          items,
          productIds: items.map((item) => Number(item.productId)),
        };
      }

      const product = getOfferProductById(numericId);

      const item = {
        productId: numericId,
        size: getDefaultOfferSize(product),
        quantity: 1,
      };

      const items = [...currentItems, item];

      return {
        ...current,
        items,
        productIds: items.map((entry) => Number(entry.productId)),
      };
    });
  }

  function updateOfferItem(id, patch) {
    const numericId = Number(id);

    setOfferForm((current) => ({
      ...current,
      items: (Array.isArray(current.items) ? current.items : []).map(
        (item) =>
          Number(item.productId) === numericId
            ? {
                ...item,
                ...patch,
                quantity: Math.max(
                  1,
                  Number(patch.quantity ?? item.quantity) || 1
                ),
              }
            : item
      ),
    }));
  }

  function getSelectedOfferItem(id) {
    return (Array.isArray(offerForm.items) ? offerForm.items : []).find(
      (item) => Number(item.productId) === Number(id)
    );
  }

  async function submitOffer(
    event
  ) {
    event.preventDefault();

    const title =
      String(
        offerForm.title ??
          ''
      ).trim();

    if (!title) {
      notify(
        'error',
        'اكتبي اسم العرض.'
      );

      return;
    }

    if (!offerForm.branchIds?.length) {
      notify('error', 'اختاري فرعًا واحدًا على الأقل للعرض.');
      return;
    }

    if (!offerItems.length) {
      notify(
        'error',
        'اختاري صنفًا واحدًا على الأقل، وحددي حجمه وعدده.'
      );

      return;
    }

    const invalidOfferItem = offerItems.find(
      (item) =>
        !availableOfferProducts.some(
          (product) =>
            Number(product.id) === Number(item.productId)
        ) ||
        (item.size === 'M'
          ? item.product.price === '' || item.product.price == null
          : item.product.largePrice === '' || item.product.largePrice == null)
    );

    if (invalidOfferItem) {
      notify(
        'error',
        'تأكدي أن كل صنف مختار له سعر للحجم المحدد.'
      );
      return;
    }

    if (
      offerForm.discountType ===
        'percentage' &&
      discountValue >
        100
    ) {
      notify(
        'error',
        'نسبة الخصم لا يمكن أن تتجاوز 100%.'
      );

      return;
    }

    setLoading(true);

    try {
      let image =
        offerForm.image ||
        '';

      if (
        offerForm.imageFile
      ) {
        image =
          await uploadImage(
            offerForm.imageFile
          );
      }

      const payload = {
        title,

        description: generatedOfferDescription,

        image,

        branchIds:
          offerForm.branchIds,

        productIds:
          offerItems.map((item) => Number(item.productId)),

        items:
          offerItems.map((item) => ({
            productId: Number(item.productId),
            size: item.size === 'L' ? 'L' : 'M',
            quantity: Math.max(1, Number(item.quantity) || 1),
          })),

        discountType:
          offerForm.discountType,

        discountValue,

        isActive:
          offerForm.isActive !==
          false,
      };

      const wasEditing =
        Boolean(
          editingOfferId
        );

      await api(
        wasEditing
          ? `/api/admin/offers/${editingOfferId}`
          : '/api/admin/offers',
        {
          method:
            wasEditing
              ? 'PUT'
              : 'POST',

          body:
            JSON.stringify(
              payload
            ),
        }
      );

      await onDataChange();

      resetOffer();

      notify(
        'success',
        wasEditing
          ? 'تم تعديل العرض بنجاح.'
          : 'تمت إضافة العرض بنجاح.'
      );
    } catch (error) {
      notify(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  function editOffer(
    offer
  ) {
    setEditingOfferId(
      offer.id
    );

    const normalizedOffer = normalizeOffer(offer);

    if (!normalizedOffer.items.length && normalizedOffer.productIds.length) {
      normalizedOffer.items = normalizedOffer.productIds
        .map((productId) => {
          const product = getOfferProductById(productId);
          if (!product) return null;
          return {
            productId: Number(productId),
            size: getDefaultOfferSize(product),
            quantity: 1,
          };
        })
        .filter(Boolean);
    }

    setOfferForm(
      {
        ...normalizedOffer,
        productIds: normalizedOffer.items.map((item) => Number(item.productId)),
      }
    );

    const selectedSections =
      categories
        .filter(
          (category) =>
            products.some(
              (product) =>
                getProductCategoryId(product) ===
                  normalizeId(category.id) &&
                offer.productIds?.includes(
                  Number(
                    product.id
                  )
                )
            )
        )
        .map(
          (category) =>
            category.id
        );

    setExpandedOfferSections(
      selectedSections
    );

    changeTab(
      'offers'
    );
  }

  async function deleteOffer(
    id
  ) {
    if (
      !window.confirm(
        'هل تريدين حذف العرض؟'
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      await api(
        `/api/admin/offers/${id}`,
        {
          method:
            'DELETE',
        }
      );

      await onDataChange();

      notify(
        'success',
        'تم حذف العرض.'
      );
    } catch (error) {
      notify(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleOffer(
    id
  ) {
    setLoading(true);

    try {
      await api(
        `/api/admin/offers/${id}/toggle`,
        {
          method:
            'PATCH',
        }
      );

      await onDataChange();
    } catch (error) {
      notify(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function changePassword(
    event
  ) {
    event.preventDefault();

    const email =
      String(
        passwordForm.email ??
          ''
      ).trim();

    const currentPassword =
      String(
        passwordForm.currentPassword ??
          ''
      );

    const newPassword =
      String(
        passwordForm.newPassword ??
          ''
      );

    if (
      !email.includes('@')
    ) {
      notify(
        'error',
        'اكتبي إيميل صحيح.'
      );

      return;
    }

    if (!currentPassword) {
      notify(
        'error',
        'اكتبي الباسورد القديم.'
      );

      return;
    }

    if (
      newPassword.length <
      8
    ) {
      notify(
        'error',
        'الباسورد الجديد يجب أن يكون 8 أحرف على الأقل.'
      );

      return;
    }

    setLoading(true);

    try {
      await api(
        '/api/admin/credentials/change-password',
        {
          method:
            'PUT',

          body:
            JSON.stringify({
              email,

              currentPassword,

              newPassword,
            }),
        }
      );

      setPasswordForm(
        (current) => ({
          ...current,

          currentPassword:
            '',

          newPassword:
            '',
        })
      );

      notify(
        'success',
        'تم تغيير الباسورد بنجاح.'
      );
    } catch (error) {
      notify(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function addAdmin(
    event
  ) {
    event.preventDefault();

    const email =
      String(
        newAdminForm.email ??
          ''
      ).trim();

    const password =
      String(
        newAdminForm.password ??
          ''
      );

    if (
      !email.includes('@')
    ) {
      notify(
        'error',
        'اكتبي إيميل صحيح.'
      );

      return;
    }

    if (
      password.length <
      8
    ) {
      notify(
        'error',
        'الباسورد يجب أن يكون 8 أحرف على الأقل.'
      );

      return;
    }

    setLoading(true);

    try {
      await api(
        '/api/admin/credentials/add',
        {
          method:
            'POST',

          body:
            JSON.stringify({
              email,
              password,
            }),
        }
      );

      setNewAdminForm({
        ...EMPTY_ADMIN,
      });

      await onDataChange();

      notify(
        'success',
        'تمت إضافة حساب Admin جديد.'
      );
    } catch (error) {
      notify(
        'error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="dashboard-app"
      dir="rtl"
    >
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <span className="brand-mark small">
            🍔
          </span>

          <div>
            <strong>
              BITE <b>HOUSE</b>
            </strong>

            <small>
              Control Center
            </small>
          </div>
        </div>

        <nav className="dashboard-nav">
          {TABS.map(
            ({
              id,
              label,
              icon: Icon,
            }) => (
              <button
                key={id}
                type="button"
                className={
                  activeTab ===
                  id
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  changeTab(id)
                }
              >
                <Icon size={18} />

                <span>
                  {label}
                </span>

                {id ===
                  'offers' &&
                  activeOffersCount >
                    0 && (
                    <b>
                      {
                        activeOffersCount
                      }
                    </b>
                  )}
              </button>
            )
          )}
        </nav>

        <div className="dashboard-sidebar-footer">
          <button
            type="button"
            onClick={() =>
              changeTab(
                'settings'
              )
            }
          >
            <Settings
              size={15}
            />

            إعدادات الدخول
          </button>

          <button
            type="button"
            onClick={
              onLogout
            }
          >
            <LogOut
              size={15}
            />

            تسجيل الخروج
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-main-header">
          <div>
            <span>
              BITE HOUSE ADMIN
            </span>

            <h2>
              {
                currentTab.label
              }
            </h2>

            <p>
              أي قسم أو صنف تضيفيه هنا هو اللي يظهر في الموقع.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <ThemeToggle />

            <button
              type="button"
              className="dashboard-refresh"
              onClick={
                onDataChange
              }
              disabled={
                dataLoading ||
                loading
              }
            >
              <RefreshCw
                size={15}
                className={
                  dataLoading
                    ? 'spin'
                    : ''
                }
              />

              تحديث
            </button>

            <button
              type="button"
              className="dashboard-refresh"
              onClick={
                onLogout
              }
            >
              <LogOut
                size={15}
              />

              خروج
            </button>
          </div>
        </header>

        {notice.text && (
          <div
            className={`dashboard-toast ${notice.type}`}
          >
            {notice.type ===
            'success' ? (
              <Check
                size={15}
              />
            ) : (
              <X
                size={15}
              />
            )}

            {notice.text}
          </div>
        )}

        {activeTab ===
          'overview' && (
          <div className="dashboard-content">
            <section className="dashboard-welcome-card">
              <div>
                <span>
                  CONTROL CENTER
                </span>

                <h1>
                 منيو Bite House تحت إيدك 👋
                </h1>

                <p>
                  إضافة الأقسام والأصناف والعروض والتعديل والحذف بسهولة كل التغييرات تظهر مباشرة في الموقع
                </p>
              </div>

              <div className="dashboard-welcome-art">
                <BarChart3
                  size={74}
                  strokeWidth={
                    1.2
                  }
                />
              </div>
            </section>

            <section className="dashboard-stat-grid">
              <StatCard
                icon={
                  Building2
                }
                label="الفروع"
                value={
                  branches.length
                }
                hint="الفروع الحالية"
              />

              <StatCard
                icon={
                  FolderPlus
                }
                label="الأقسام"
                value={
                  categories.length
                }
                hint="الأقسام الموجودة"
              />

              <StatCard
                icon={
                  ShoppingBag
                }
                label="الأصناف"
                value={
                  products.length
                }
                hint="كل الأصناف"
              />

              <StatCard
                icon={
                  Check
                }
                label="أصناف ظاهرة"
                value={
                  activeProductsCount
                }
                hint="تظهر للعميل"
              />

              <StatCard
                icon={
                  Sparkles
                }
                label="العروض النشطة"
                value={
                  activeOffersCount
                }
                hint="تظهر للعميل"
              />
            </section>

            <section className="dashboard-quick-grid">
              <button
                type="button"
                className="dashboard-quick-card"
                onClick={() => {
                  resetCategory();
                  changeTab(
                    'categories'
                  );
                }}
              >
                <FolderPlus
                  size={24}
                />

                <div>
                  <strong>
                    إضافة قسم
                  </strong>
 <small style={{ display: 'block', marginTop: '6px' }}></small>
                  <small>
                    ابدئي بقسم جديد
                  </small>
                </div>

                <Plus
                  size={16}
                />
              </button>

              <button
                type="button"
                className="dashboard-quick-card"
                onClick={() => {
                  resetProduct();
                  changeTab(
                    'products'
                  );
                }}
              >
                <PackagePlus
                  size={24}
                />

                <div>
                  <strong>
                    إضافة صنف
                  </strong>
 <small style={{ display: 'block', marginTop: '6px' }}></small>
                  <small>
                    اختاري القسم والصورة
                  </small>
                </div>

                <Plus
                  size={16}
                />
              </button>

              <button
                type="button"
                className="dashboard-quick-card"
                onClick={() => {
                  resetOffer();
                  changeTab(
                    'offers'
                  );
                }}
              >
                <Sparkles
                  size={24}
                />

                <div>
                  <strong>
                    إضافة عرض
                  </strong>
 <small style={{ display: 'block', marginTop: '6px' }}></small>
                  <small>
                    اختاري الأقسام والأصناف
                  </small>
                </div>

                <Plus
                  size={16}
                />
              </button>
            </section>
          </div>
        )}

        {activeTab ===
          'branches' && (
          <div className="dashboard-content">
            <div className="dashboard-page-grid dashboard-page-grid-categories">
              <form className="dashboard-panel form-panel" onSubmit={submitBranch}>
                <div className="panel-title-block">
                  <span className="panel-title-icon"><Building2 size={18} /></span>
                  <div>
                    <h3>إضافة فرع جديد</h3>
                    <p>الفرع الجديد سيظهر في شاشة اختيار الفرع.</p>
                  </div>
                </div>

                <label className="dashboard-field">
                  <span>اسم الفرع بالعربي *</span>
                  <input value={branchForm.name} onChange={(event) => setBranchForm((current) => ({ ...current, name: event.target.value }))} placeholder="مثال: فرع مصر الجديدة" required />
                </label>

                <label className="dashboard-field">
                  <span>اسم الفرع بالإنجليزي</span>
                  <input value={branchForm.englishName} onChange={(event) => setBranchForm((current) => ({ ...current, englishName: event.target.value }))} placeholder="Heliopolis Branch" />
                </label>

                <label className="dashboard-field">
                  <span>العنوان *</span>
                  <textarea rows="3" value={branchForm.address} onChange={(event) => setBranchForm((current) => ({ ...current, address: event.target.value }))} placeholder="الشارع، المنطقة، بجوار..." required />
                </label>

                <div className="form-actions-row">
                  <button className="primary-button" type="submit" disabled={loading}><Plus size={15} />إضافة الفرع</button>
                  <button className="secondary-button" type="button" onClick={resetBranch}>تفريغ</button>
                </div>
              </form>

              <section className="dashboard-panel">
                <div className="panel-head">
                  <div>
                    <h3>الفروع الحالية</h3>
                    <span>{branches.length} فرع</span>
                  </div>
                </div>

                <div className="branch-admin-list">
                  {branches.map((branch, index) => (
                    <article className="branch-admin-row" key={branch.id}>
                      <span className="branch-admin-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="branch-admin-icon"><Building2 size={18} /></span>
                      <div className="branch-admin-main">
                        <strong>{branch.name}</strong>
                        <small>{branch.englishName || 'بدون اسم إنجليزي'} · {branch.address}</small>
                      </div>
                      <span className="status-on">نشط</span>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab ===
          'categories' && (
          <div className="dashboard-content">
            <div className="dashboard-page-grid dashboard-page-grid-categories">
              <form
                className="dashboard-panel form-panel"
                onSubmit={
                  submitCategory
                }
              >
                <div className="panel-title-block">
                  <span className="panel-title-icon">
                    <FolderPlus
                      size={18}
                    />
                  </span>

                  <div>
                    <h3>
                      {editingCategoryId
                        ? 'تعديل القسم'
                        : 'إضافة قسم'}
                    </h3>

                    <p>
                      من غير Emoji أو صور.
                    </p>
                  </div>
                </div>

                <label className="dashboard-field">
                  <span>
                    اسم القسم بالعربي *
                  </span>

                  <input
                    value={
                      categoryForm.label ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setCategoryForm(
                        (
                          current
                        ) => ({
                          ...current,

                          label:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="مثال: البرجر"
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>
                    الاسم بالإنجليزي
                  </span>

                  <input
                    value={
                      categoryForm.englishName ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setCategoryForm(
                        (
                          current
                        ) => ({
                          ...current,

                          englishName:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Burgers"
                  />
                </label>

                <BranchMultiSelect
                  branches={branches}
                  value={categoryForm.branchIds}
                  onChange={(branchIds) => setCategoryForm((current) => ({ ...current, branchIds }))}
                />

                <div className="form-actions-row">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={
                      loading
                    }
                  >
                    {editingCategoryId ? (
                      <Edit3
                        size={15}
                      />
                    ) : (
                      <Plus
                        size={15}
                      />
                    )}

                    {editingCategoryId
                      ? 'حفظ التعديل'
                      : 'إضافة القسم'}
                  </button>

                  {editingCategoryId && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={
                        resetCategory
                      }
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </form>

              <section className="dashboard-panel">
                <div className="panel-head">
                  <div>
                    <h3>
                      الأقسام الحالية
                    </h3>

                    <span>
                      {categories.length}{' '}
                      قسم
                    </span>
                  </div>
                </div>

                <div className="category-manage-list">
                  {categories.map(
                    (
                      category,
                      index
                    ) => (
                      <article
                        className="category-manage-row"
                        key={
                          category.id
                        }
                      >
                        <span className="category-manage-index">
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            '0'
                          )}
                        </span>

                        <div className="category-manage-main">
                          <strong>
                            {
                              category.label
                            }
                          </strong>

                          <small>
                            {category.englishName ||
                              'بدون اسم إنجليزي'}{' '}
                            ·{' '}
                            {
                              products.filter(
                                (
                                  product
                                ) =>
                                  product.category ===
                                  category.id
                              ).length
                            }{' '}
                            صنف
                          </small>
                        </div>

                        <div className="category-manage-actions">
                          <button
                            type="button"
                            onClick={() =>
                              editCategory(
                                category
                              )
                            }
                            title="تعديل"
                          >
                            <Edit3
                              size={14}
                            />
                          </button>

                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() =>
                              deleteCategory(
                                category.id
                              )
                            }
                            title="حذف القسم بكل أصنافه"
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>
                      </article>
                    )
                  )}

                  {!categories.length && (
                    <div className="admin-empty-panel">
                      <span className="admin-empty-icon">
                        <FolderPlus
                          size={22}
                        />
                      </span>

                      <h3>
                        ابدئي بإضافة أول قسم
                      </h3>

                      <p>
                        القسم هيظهر في الموقع فور إضافته.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab ===
          'products' && (
          <div className="dashboard-content">
            <div className="dashboard-page-grid dashboard-page-grid-products">
              <form
                className="dashboard-panel form-panel"
                onSubmit={
                  submitProduct
                }
              >
                <div className="panel-title-block">
                  <span className="panel-title-icon">
                    <PackagePlus
                      size={18}
                    />
                  </span>

                  <div>
                    <h3>
                      {editingProductId
                        ? 'تعديل الصنف'
                        : 'إضافة صنف'}
                    </h3>

                    <p>
                      اختاري القسم والصورة بدون Emoji.
                    </p>
                  </div>
                </div>

                <label className="dashboard-field">
                  <span>
                    الاسم بالعربي *
                  </span>

                  <input
                    value={
                      productForm.nameAr ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm(
                        (
                          current
                        ) => ({
                          ...current,

                          nameAr:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>
                    الاسم بالإنجليزي *
                  </span>

                  <input
                    value={
                      productForm.name ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm(
                        (
                          current
                        ) => ({
                          ...current,

                          name:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>
                    الوصف
                  </span>

                  <textarea
                    rows="3"
                    value={
                      productForm.description ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm(
                        (
                          current
                        ) => ({
                          ...current,

                          description:
                            event.target
                              .value,
                        })
                      )
                    }
                  />
                </label>

                <div className="dashboard-form-grid">
                  <label className="dashboard-field">
                    <span>
                      القسم *
                    </span>

                    <select
                      value={
                        productForm.category ??
                        ''
                      }
                      onChange={(
                        event
                      ) =>
                        setProductForm(
                          (
                            current
                          ) => ({
                            ...current,

                            category:
                              event.target
                                .value,
                          })
                        )
                      }
                      required
                    >
                      <option value="">
                        اختاري القسم
                      </option>

                      {categories.map(
                        (
                          category
                        ) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {
                              category.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="dashboard-field">
                    <span>
                      السعر الصغير
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        productForm.price ??
                        ''
                      }
                      onChange={(
                        event
                      ) =>
                        setProductForm(
                          (
                            current
                          ) => ({
                            ...current,

                            price:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>
                </div>

                <div className="dashboard-form-grid">
                  <label className="dashboard-field">
                    <span>
                      السعر الكبير
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        productForm.largePrice ??
                        ''
                      }
                      onChange={(
                        event
                      ) =>
                        setProductForm(
                          (
                            current
                          ) => ({
                            ...current,

                            largePrice:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>

                  <label className="dashboard-field">
                    <span>
                      Badge
                    </span>

                    <input
                      value={
                        productForm.badge ??
                        ''
                      }
                      onChange={(
                        event
                      ) =>
                        setProductForm(
                          (
                            current
                          ) => ({
                            ...current,

                            badge:
                              event.target
                                .value,
                          })
                        )
                      }
                      placeholder="جديد"
                    />
                  </label>
                </div>

                <BranchMultiSelect
                  branches={branches}
                  value={productForm.branchIds}
                  onChange={(branchIds) => setProductForm((current) => ({ ...current, branchIds }))}
                />

                <ImageField
                  label="صورة الصنف"
                  value={
                    productForm.image
                  }
                  file={
                    productForm.imageFile
                  }
                  onFile={(
                    file
                  ) =>
                    setProductForm(
                      (
                        current
                      ) => ({
                        ...current,

                        imageFile:
                          file,
                      })
                    )
                  }
                  onClear={() =>
                    setProductForm(
                      (
                        current
                      ) => ({
                        ...current,

                        image: '',
                        imageFile:
                          null,
                      })
                    )
                  }
                />

                <label className="dashboard-switch-line">
                  <input
                    type="checkbox"
                    checked={
                      productForm.isAvailable !==
                      false
                    }
                    onChange={(
                      event
                    ) =>
                      setProductForm(
                        (
                          current
                        ) => ({
                          ...current,

                          isAvailable:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span className="dashboard-switch" />

                  <span>
                    <strong>
                      إظهار الصنف للعميل
                    </strong>

                    <small>
                      إخفاؤه لا يحذفه.
                    </small>
                  </span>
                </label>

                <div className="form-actions-row">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={
                      loading ||
                      !categories.length
                    }
                  >
                    <Check
                      size={15}
                    />

                    {editingProductId
                      ? 'حفظ الصنف'
                      : 'إضافة الصنف'}
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={
                      resetProduct
                    }
                  >
                    تفريغ
                  </button>
                </div>

                {!categories.length && (
                  <div className="security-note">
                    <FolderPlus
                      size={15}
                    />

                    <span>
                      لازم تضيفي قسم أولًا قبل إضافة صنف.
                    </span>
                  </div>
                )}
              </form>

              <section className="dashboard-panel">
                <div className="panel-head">
                  <div>
                    <h3>
                      الأصناف الحالية
                    </h3>

                    <span>
                      {
                        filteredProducts.length
                      }{' '}
                      صنف
                    </span>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      resetProduct
                    }
                  >
                    <Plus
                      size={14}
                    />

                    إضافة
                  </button>
                </div>

                <div className="product-toolbar">
                  <label className="admin-search">
                    <Search
                      size={15}
                    />

                    <input
                      value={
                        productSearch
                      }
                      onChange={(
                        event
                      ) =>
                        setProductSearch(
                          event.target
                            .value
                        )
                      }
                      placeholder="ابحثي في الأصناف..."
                    />
                  </label>

                  <select
                    value={
                      productFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setProductFilter(
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="all">
                      كل الأقسام
                    </option>

                    {categories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="product-admin-list">
                  {filteredProducts.map(
                    (
                      product
                    ) => (
                      <article
                        className={`product-admin-row ${
                          product.isAvailable ===
                          false
                            ? 'is-disabled'
                            : ''
                        }`}
                        key={
                          product.id
                        }
                      >
                        <div className="product-admin-image">
                          {product.image ? (
                            <img
                              src={
                                product.image
                              }
                              alt=""
                            />
                          ) : (
                            <ImagePlus
                              size={23}
                            />
                          )}
                        </div>

                        <div className="product-admin-main">
                          <div className="product-admin-name">
                            <strong>
                              {
                                product.nameAr
                              }
                            </strong>

                            <span>
                              {
                                product.name
                              }
                            </span>
                          </div>

                          <small>
                            {categories.find(
                              (
                                category
                              ) =>
                                category.id ===
                                product.category
                            )
                              ?.label ||
                              'بدون قسم'}
                          </small>
                        </div>

                        <div className="product-admin-price">
                          <strong>
                            {money(
                              product.price
                            )}{' '}
                            ج.م
                          </strong>

                          {product.largePrice !=
                            null && (
                            <small>
                              L{' '}
                              {money(
                                product.largePrice
                              )}{' '}
                              ج.م
                            </small>
                          )}
                        </div>

                        <div className="product-admin-actions">
                          <button
                            type="button"
                            onClick={() =>
                              toggleProduct(
                                product.id
                              )
                            }
                          >
                            {product.isAvailable ===
                            false
                              ? 'إظهار'
                              : 'إخفاء'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              editProduct(
                                product
                              )
                            }
                          >
                            <Edit3
                              size={13}
                            />

                            تعديل
                          </button>

                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() =>
                              deleteProduct(
                                product.id
                              )
                            }
                          >
                            <Trash2
                              size={13}
                            />

                            حذف
                          </button>
                        </div>
                      </article>
                    )
                  )}

                  {!filteredProducts.length && (
                    <div className="admin-empty-panel">
                      <span className="admin-empty-icon">
                        <ShoppingBag
                          size={22}
                        />
                      </span>

                      <h3>
                        مفيش أصناف
                      </h3>

                      <p>
                        أضيفي قسم وبعده الأصناف الخاصة بيه.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab ===
          'offers' && (
          <div className="dashboard-content">
            <div className="dashboard-page-grid dashboard-page-grid-offers">
              <form
                className="dashboard-panel form-panel"
                onSubmit={
                  submitOffer
                }
              >
                <div className="panel-title-block">
                  <span className="panel-title-icon">
                    <Sparkles
                      size={18}
                    />
                  </span>

                  <div>
                    <h3>
                      {editingOfferId
                        ? 'تعديل العرض'
                        : 'إضافة عرض'}
                    </h3>

                    <p>
                      اختاري الأقسام ثم الأصناف.
                    </p>
                  </div>
                </div>

                <label className="dashboard-field">
                  <span>
                    اسم العرض *
                  </span>

                  <input
                    value={
                      offerForm.title ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setOfferForm(
                        (
                          current
                        ) => ({
                          ...current,

                          title:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>
                    تفاصيل العرض تلقائيًا
                  </span>

                  <textarea
                    rows="3"
                    value={generatedOfferDescription}
                    readOnly
                    placeholder="اختاري الأصناف والحجم والعدد، والتفاصيل هتتكتب تلقائيًا هنا."
                  />

                  <small className="field-hint">
                    التفاصيل بتتكوّن تلقائيًا من اسم كل صنف وحجمه وعدده، وبين الأصناف علامة +.
                  </small>
                </label>

                <ImageField
                  label="صورة العرض"
                  value={
                    offerForm.image
                  }
                  file={
                    offerForm.imageFile
                  }
                  onFile={(
                    file
                  ) =>
                    setOfferForm(
                      (
                        current
                      ) => ({
                        ...current,

                        imageFile:
                          file,
                      })
                    )
                  }
                  onClear={() =>
                    setOfferForm(
                      (
                        current
                      ) => ({
                        ...current,

                        image: '',
                        imageFile:
                          null,
                      })
                    )
                  }
                />

                <BranchMultiSelect
                  branches={branches}
                  value={offerForm.branchIds}
                  onChange={(branchIds) =>
                    setOfferForm((current) => ({
                      ...current,
                      branchIds: branchIds.map(normalizeId),
                      productIds: [],
                      items: [],
                    }))
                  }
                />

                {!selectedOfferBranchIds.length && (
                  <div className="security-note">
                    اختاري الفروع في الأعلى، أو افتحي أي قسم لمشاهدة أصنافه. عند الحفظ لازم يكون فيه فرع واحد على الأقل.
                  </div>
                )}

                <div className="dashboard-form-section">
                  <div className="section-title-with-count">
                    <h4>
                      اختاري الأقسام
                    </h4>

                    <span>
                      {
                        expandedOfferSections.length
                      }{' '}
                      مفتوح
                    </span>
                  </div>

                  {!categories.length && (
                    <div className="admin-empty-panel">
                      <span className="admin-empty-icon">
                        <FolderPlus
                          size={22}
                        />
                      </span>

                      <h3>
                        مفيش أقسام
                      </h3>

                      <p>
                        أضيفي الأقسام أولًا عشان تعملي العرض.
                      </p>
                    </div>
                  )}

                  <div className="offer-product-options">
                    {categories.map(
                      (
                        category
                      ) => {
                        const categoryProducts =
                          availableOfferProducts.filter(
                            (
                              product
                            ) =>
                              productMatchesCategory(
                                product,
                                category
                              )
                          );

                        const expanded =
                          expandedOfferSections.includes(
                            category.id
                          );

                        const selectedCount =
                          categoryProducts.filter(
                            (
                              product
                            ) =>
                              offerForm.productIds.includes(
                                Number(
                                  product.id
                                )
                              )
                          ).length;

                        return (
                          <button
                            type="button"
                            key={
                              category.id
                            }
                            className={`offer-product-option ${
                              expanded
                                ? 'selected'
                                : ''
                            }`}
                            onClick={() =>
                              toggleOfferSection(
                                category.id
                              )
                            }
                          >
                            <span className="offer-option-check">
                              {expanded ? (
                                <Check
                                  size={
                                    12
                                  }
                                />
                              ) : null}
                            </span>

                            <span className="offer-option-copy">
                              <strong>
                                {
                                  category.label
                                }
                              </strong>

                              <small>
                                {
                                  selectedCount
                                }
                                /
                                {
                                  categoryProducts.length
                                }{' '}
                                مختار
                              </small>
                            </span>

                            <ChevronDown
                              size={
                                15
                              }
                              style={{
                                transform:
                                  expanded
                                    ? 'rotate(180deg)'
                                    : 'rotate(0deg)',
                              }}
                            />
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {expandedOfferSections.map(
                  (
                    sectionId
                  ) => {
                    const category =
                      categories.find(
                        (
                          item
                        ) =>
                          item.id ===
                          sectionId
                      );

                    if (
                      !category
                    ) {
                      return null;
                    }

                    const sectionProducts =
                      availableOfferProducts.filter(
                        (
                          product
                        ) =>
                          productMatchesCategory(
                            product,
                            category
                          )
                      );

                    return (
                      <div
                        className="dashboard-form-section"
                        key={
                          sectionId
                        }
                      >
                        <div className="section-title-with-count">
                          <h4>
                            {
                              category.label
                            }
                          </h4>

                          <span>
                            {
                              sectionProducts.length
                            }{' '}
                            صنف
                          </span>
                        </div>

                        {sectionProducts.length ===
                          0 && (
                          <div className="admin-empty-panel">
                            <p>
                              مفيش أصناف في القسم ده لسه.
                            </p>
                          </div>
                        )}

                        <div className="offer-product-options">
                          {sectionProducts.map(
                            (
                              product
                            ) => {
                              const selected =
                                offerForm.productIds.includes(
                                  Number(
                                    product.id
                                  )
                                );

                              const selectedItem = getSelectedOfferItem(product.id);

                              return (
                                <div
                                  className="offer-product-config"
                                  key={product.id}
                                >
                                  <button
                                    type="button"
                                    className={`offer-product-option ${
                                      selected
                                        ? 'selected'
                                        : ''
                                    }`}
                                    onClick={() =>
                                      toggleOfferProduct(product.id)
                                    }
                                  >
                                    <span className="offer-option-check">
                                      {selected ? (
                                        <Check size={12} />
                                      ) : null}
                                    </span>

                                    <span className="offer-option-image">
                                      {product.image ? (
                                        <img
                                          src={product.image}
                                          alt=""
                                        />
                                      ) : (
                                        <ImagePlus size={16} />
                                      )}
                                    </span>

                                    <span className="offer-option-copy">
                                      <strong>
                                        {product.nameAr || product.name}
                                      </strong>

                                      <small>
                                        {product.price !== '' && product.price != null
                                          ? `M ${money(product.price)} ج.م`
                                          : ''}
                                        {product.price !== '' && product.price != null && product.largePrice !== '' && product.largePrice != null
                                          ? ' · '
                                          : ''}
                                        {product.largePrice !== '' && product.largePrice != null
                                          ? `L ${money(product.largePrice)} ج.م`
                                          : ''}
                                      </small>
                                    </span>
                                  </button>

                                  {selected && selectedItem && (
                                    <div className="offer-item-settings">
                                      <div className="offer-size-picker">
                                        <span>الحجم</span>

                                        <div className="offer-size-buttons">
                                          <button
                                            type="button"
                                            disabled={product.price === '' || product.price == null}
                                            className={selectedItem.size === 'M' ? 'active' : ''}
                                            onClick={() => updateOfferItem(product.id, { size: 'M' })}
                                          >
                                            M
                                          </button>

                                          <button
                                            type="button"
                                            disabled={product.largePrice === '' || product.largePrice == null}
                                            className={selectedItem.size === 'L' ? 'active' : ''}
                                            onClick={() => updateOfferItem(product.id, { size: 'L' })}
                                          >
                                            L
                                          </button>
                                        </div>
                                      </div>

                                      <label className="offer-quantity-field">
                                        <span>العدد</span>
                                        <input
                                          type="number"
                                          min="1"
                                          step="1"
                                          value={selectedItem.quantity}
                                          onChange={(event) =>
                                            updateOfferItem(product.id, {
                                              quantity: Math.max(1, Number(event.target.value) || 1),
                                            })
                                          }
                                        />
                                      </label>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  }
                )}

                <div className="dashboard-form-section">
                  <h4>
                    الخصم
                  </h4>

                  <div className="discount-type-switch">
                    <button
                      type="button"
                      className={
                        offerForm.discountType ===
                        'percentage'
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setOfferForm(
                          (
                            current
                          ) => ({
                            ...current,

                            discountType:
                              'percentage',
                          })
                        )
                      }
                    >
                      <Percent
                        size={14}
                      />

                      نسبة %
                    </button>

                    <button
                      type="button"
                      className={
                        offerForm.discountType ===
                        'fixed'
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        setOfferForm(
                          (
                            current
                          ) => ({
                            ...current,

                            discountType:
                              'fixed',
                          })
                        )
                      }
                    >
                      <Tag
                        size={14}
                      />

                      مبلغ ثابت
                    </button>
                  </div>

                  <label className="dashboard-field">
                    <span>
                      {offerForm.discountType ===
                      'percentage'
                        ? 'نسبة الخصم %'
                        : 'قيمة الخصم ج.م'}
                    </span>

                    <input
                      type="number"
                      min="0"
                      max={
                        offerForm.discountType ===
                        'percentage'
                          ? 100
                          : undefined
                      }
                      step="0.01"
                      value={
                        offerForm.discountValue ??
                        ''
                      }
                      onChange={(
                        event
                      ) =>
                        setOfferForm(
                          (
                            current
                          ) => ({
                            ...current,

                            discountValue:
                              event.target
                                .value,
                          })
                        )
                      }
                    />
                  </label>

                  <div className="offer-calculation-preview">
                    <div>
                      <span>
                        إجمالي الأصناف
                      </span>

                      <strong>
                        {money(
                          offerSubtotal
                        )}{' '}
                        ج.م
                      </strong>
                    </div>

                    <div>
                      <span>
                        الخصم
                      </span>

                      <strong className="discount-number">
                        -
                        {money(
                          offerDiscount
                        )}{' '}
                        ج.م
                      </strong>
                    </div>

                    <div className="final">
                      <span>
                        سعر العرض
                      </span>

                      <strong>
                        {money(
                          offerFinal
                        )}{' '}
                        ج.م
                      </strong>
                    </div>
                  </div>
                </div>

                <label className="dashboard-switch-line">
                  <input
                    type="checkbox"
                    checked={
                      offerForm.isActive !==
                      false
                    }
                    onChange={(
                      event
                    ) =>
                      setOfferForm(
                        (
                          current
                        ) => ({
                          ...current,

                          isActive:
                            event.target
                              .checked,
                        })
                      )
                    }
                  />

                  <span className="dashboard-switch" />

                  <span>
                    <strong>
                      إظهار العرض للعميل
                    </strong>

                    <small>
                      إخفاؤه لا يحذفه.
                    </small>
                  </span>
                </label>

                <div className="form-actions-row">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={
                      loading ||
                      !availableOfferProducts.length
                    }
                  >
                    <Check
                      size={15}
                    />

                    {editingOfferId
                      ? 'حفظ العرض'
                      : 'إضافة العرض'}
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={
                      resetOffer
                    }
                  >
                    تفريغ
                  </button>
                </div>
              </form>

              <section className="dashboard-panel">
                <div className="panel-head">
                  <div>
                    <h3>
                      العروض الحالية
                    </h3>

                    <span>
                      {offers.length}{' '}
                      عرض
                    </span>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      resetOffer
                    }
                  >
                    <Plus
                      size={14}
                    />

                    إضافة
                  </button>
                </div>

                <div className="offers-admin-list">
                  {offers.map(
                    (
                      offer
                    ) => (
                      <article
                        className={`offer-admin-row ${
                          offer.isActive ===
                          false
                            ? 'is-disabled'
                            : ''
                        }`}
                        key={
                          offer.id
                        }
                      >
                        <div className="offer-admin-image">
                          {offer.image ? (
                            <img
                              src={
                                offer.image
                              }
                              alt=""
                            />
                          ) : (
                            <ImagePlus
                              size={
                                21
                              }
                            />
                          )}
                        </div>

                        <div className="offer-admin-main">
                          <div className="offer-admin-name">
                            <strong>
                              {
                                offer.title
                              }
                            </strong>

                            <span
                              className={
                                offer.isActive ===
                                false
                                  ? 'status-off'
                                  : 'status-on'
                              }
                            >
                              {offer.isActive ===
                              false
                                ? 'مخفي'
                                : 'نشط'}
                            </span>
                          </div>

                          <small>
                            {Array.isArray(
                              offer.products
                            )
                              ? offer.products
                                  .map(
                                    (
                                      product
                                    ) =>
                                      product.nameAr
                                  )
                                  .join(
                                    ' + '
                                  )
                              : ''}
                          </small>

                          <div className="offer-admin-price">
                            <del>
                              {money(
                                offer.originalTotal
                              )}{' '}
                              ج.م
                            </del>

                            <strong>
                              {money(
                                offer.finalTotal
                              )}{' '}
                              ج.م
                            </strong>
                          </div>
                        </div>

                        <div className="offer-admin-actions">
                          <button
                            type="button"
                            onClick={() =>
                              toggleOffer(
                                offer.id
                              )
                            }
                          >
                            {offer.isActive ===
                            false
                              ? 'إظهار'
                              : 'إخفاء'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              editOffer(
                                offer
                              )
                            }
                          >
                            <Edit3
                              size={13}
                            />

                            تعديل
                          </button>

                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() =>
                              deleteOffer(
                                offer.id
                              )
                            }
                          >
                            <Trash2
                              size={13}
                            />

                            حذف
                          </button>
                        </div>
                      </article>
                    )
                  )}

                  {!offers.length && (
                    <div className="admin-empty-panel">
                      <span className="admin-empty-icon">
                        <Sparkles
                          size={22}
                        />
                      </span>

                      <h3>
                        مفيش عروض
                      </h3>

                      <p>
                        اختاري الأقسام والأصناف واعملي أول عرض.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab ===
          'settings' && (
          <div className="dashboard-content">
            <div className="dashboard-settings-grid">
              <form
                className="dashboard-panel form-panel"
                onSubmit={
                  changePassword
                }
              >
                <div className="panel-title-block">
                  <span className="panel-title-icon">
                    <LockKeyhole
                      size={18}
                    />
                  </span>

                  <div>
                    <h3>
                      تغيير الباسورد
                    </h3>

                    <p>
                      الإيميل + الباسورد القديم + الباسورد الجديد فقط.
                    </p>
                  </div>
                </div>

                <label className="dashboard-field">
                  <span>
                    الإيميل
                  </span>

                  <input
                    type="email"
                    value={
                      passwordForm.email ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setPasswordForm(
                        (
                          current
                        ) => ({
                          ...current,

                          email:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>
                    الباسورد القديم
                  </span>

                  <input
                    type="password"
                    value={
                      passwordForm.currentPassword ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setPasswordForm(
                        (
                          current
                        ) => ({
                          ...current,

                          currentPassword:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>
                    الباسورد الجديد
                  </span>

                  <input
                    type="password"
                    minLength="8"
                    value={
                      passwordForm.newPassword ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setPasswordForm(
                        (
                          current
                        ) => ({
                          ...current,

                          newPassword:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={
                    loading
                  }
                >
                  <LockKeyhole
                    size={15}
                  />

                  حفظ الباسورد
                </button>
              </form>

              <form
                className="dashboard-panel form-panel"
                onSubmit={
                  addAdmin
                }
              >
                <div className="panel-title-block">
                  <span className="panel-title-icon">
                    <Plus size={18} />
                  </span>

                  <div>
                    <h3>
                      إضافة Admin جديد
                    </h3>

                    <p>
                      كل شخص له إيميل وباسورد مستقل.
                    </p>
                  </div>
                </div>

                <label className="dashboard-field">
                  <span>
                    الإيميل الجديد
                  </span>

                  <input
                    type="email"
                    value={
                      newAdminForm.email ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setNewAdminForm(
                        (
                          current
                        ) => ({
                          ...current,

                          email:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>
                    الباسورد الجديد
                  </span>

                  <input
                    type="password"
                    minLength="8"
                    value={
                      newAdminForm.password ??
                      ''
                    }
                    onChange={(
                      event
                    ) =>
                      setNewAdminForm(
                        (
                          current
                        ) => ({
                          ...current,

                          password:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={
                    loading
                  }
                >
                  <Plus
                    size={15}
                  />

                  إضافة الحساب
                </button>

                <div className="security-note">
                  <LockKeyhole
                    size={15}
                  />

                  <span>
                    بيانات الدخول تُحفظ على السيرفر داخل .env.
                  </span>
                </div>
              </form>
            </div>

            <section
              className="dashboard-panel"
              style={{
                marginTop: 17,
              }}
            >
              <div className="panel-head">
                <div>
                  <h3>
                    حسابات الداشبورد
                  </h3>

                  <span>
                    {
                      adminEmails.length
                    }{' '}
                    حساب
                  </span>
                </div>
              </div>

              <div className="category-manage-list">
                {adminEmails.map(
                  (
                    adminEmail
                  ) => (
                    <article
                      className="category-manage-row"
                      key={
                        adminEmail
                      }
                    >
                      <span className="category-manage-index">
                        <LockKeyhole
                          size={14}
                        />
                      </span>

                      <div className="category-manage-main">
                        <strong>
                          {
                            adminEmail
                          }
                        </strong>

                        <small>
                          حساب Admin
                        </small>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}