import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import {
  defaultData,
} from './defaultData.js';


const ROOT =
  process.cwd();

const DATA_DIR =
  path.join(
    ROOT,
    'data'
  );

const DB_FILE =
  path.join(
    DATA_DIR,
    'db.json'
  );

const ENV_FILE =
  path.join(
    ROOT,
    '.env'
  );

const UPLOAD_DIR =
  path.join(
    ROOT,
    'public',
    'uploads'
  );


fs.mkdirSync(
  DATA_DIR,
  {
    recursive: true,
  }
);

fs.mkdirSync(
  UPLOAD_DIR,
  {
    recursive: true,
  }
);


/* =========================================================
   DATABASE
   ========================================================= */

function clone(
  value
) {
  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}

function makeBranchId(
  name
) {
  const base =
    String(name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    `branch-${Date.now()}`;

  let id = base;
  let counter = 2;

  while (database.branches.some((branch) => branch.id === id)) {
    id = `${base}-${counter++}`;
  }

  return id;
}

function normalizeBranchIds(value, branches) {
  const validIds = new Set(
    branches.map((branch) => String(branch.id).trim())
  );

  return [
    ...new Set(
      (Array.isArray(value) ? value : [])
        .map((id) => String(id).trim())
        .filter((id) => validIds.has(id))
    ),
  ];
}

function normalizeCategoryId(value) {
  return String(value ?? '').trim();
}

function getStoredProductCategoryId(product) {
  return normalizeCategoryId(
    product?.category ?? product?.categoryId
  );
}

function normalizeStoredData(data) {
  const branches =
    Array.isArray(data?.branches) && data.branches.length
      ? data.branches
          .map((branch) => ({
            id: String(branch?.id || '').trim(),
            name: String(branch?.name || '').trim(),
            englishName: String(branch?.englishName || '').trim(),
            address: String(branch?.address || '').trim(),
            isActive: branch?.isActive !== false,
          }))
          .filter((branch) => branch.id && branch.name)
      : clone(defaultData.branches || []);

  const rawCategories = Array.isArray(data?.categories)
    ? data.categories
    : [];

  const categories = rawCategories.map((category, index) => ({
    ...category,
    id: normalizeCategoryId(category?.id),
    label: String(category?.label ?? '').trim(),
    englishName: String(category?.englishName ?? '').trim(),
    sortOrder: Number(category?.sortOrder ?? index + 1),
    branchIds: normalizeBranchIds(
      Array.isArray(category?.branchIds) && category.branchIds.length
        ? category.branchIds
        : branches.map((branch) => branch.id),
      branches
    ),
  })).filter((category) => category.id && category.label);

  const categoryMap = new Map(
    categories.map((category) => [category.id, category])
  );

  const products =
    (Array.isArray(data?.products) ? data.products : []).map((product) => {
      const categoryId = getStoredProductCategoryId(product);
      const category = categoryMap.get(categoryId);

      const rawBranchIds = Array.isArray(product?.branchIds)
        ? product.branchIds
        : [];

      const fallbackBranchIds =
        category?.branchIds?.length
          ? category.branchIds
          : branches.map((branch) => branch.id);

      return {
        ...product,
        category: categoryId,
        branchIds: normalizeBranchIds(
          rawBranchIds.length ? rawBranchIds : fallbackBranchIds,
          branches
        ),
      };
    });

  const offers =
    (Array.isArray(data?.offers) ? data.offers : []).map((offer) => ({
      ...offer,
      branchIds: normalizeBranchIds(
        Array.isArray(offer?.branchIds) && offer.branchIds.length
          ? offer.branchIds
          : branches.map((branch) => branch.id),
        branches
      ),
    }));

  return {
    branches,
    categories,
    products,
    offers,
  };
}

function ensureDatabase() {
  if (
    !fs.existsSync(
      DB_FILE
    )
  ) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        defaultData,
        null,
        2
      ),
      'utf8'
    );
  }
}

function loadDatabase() {
  ensureDatabase();

  try {
    const data =
      JSON.parse(
        fs.readFileSync(
          DB_FILE,
          'utf8'
        )
      );

    return normalizeStoredData(data);
  } catch {
    return clone(
      defaultData
    );
  }
}

let database =
  loadDatabase();

function saveDatabase() {
  const tempFile =
    `${DB_FILE}.tmp`;

  fs.writeFileSync(
    tempFile,
    JSON.stringify(
      database,
      null,
      2
    ),
    'utf8'
  );

  fs.renameSync(
    tempFile,
    DB_FILE
  );
}


/* =========================================================
   ENV
   ========================================================= */

function readEnvFile() {
  if (
    !fs.existsSync(
      ENV_FILE
    )
  ) {
    return {};
  }

  const result =
    {};

  const lines =
    fs.readFileSync(
      ENV_FILE,
      'utf8'
    ).split(
      /\r?\n/
    );

  for (
    let line of lines
  ) {
    line =
      line
        .replace(
          /^\uFEFF/,
          ''
        )
        .trim();

    if (
      !line ||
      line.startsWith('#')
    ) {
      continue;
    }

    const separator =
      line.indexOf('=');

    if (
      separator ===
      -1
    ) {
      continue;
    }

    const key =
      line
        .slice(
          0,
          separator
        )
        .trim();

    let value =
      line
        .slice(
          separator + 1
        )
        .trim();

    if (
      value.startsWith(
        '"'
      ) &&
      value.endsWith(
        '"'
      )
    ) {
      value =
        value.slice(
          1,
          -1
        );
    }

    if (
      value.startsWith(
        "'"
      ) &&
      value.endsWith(
        "'"
      )
    ) {
      value =
        value.slice(
          1,
          -1
        );
    }

    result[key] =
      value;
  }

  return result;
}

function getEnvValue(
  name
) {
  return String(
    readEnvFile()[
      name
    ] || ''
  ).trim();
}


/* =========================================================
   MULTIPLE ADMIN ACCOUNTS
   ========================================================= */

function getAdminAccounts() {
  const env =
    readEnvFile();

  const accounts =
    [];

  const usedEmails =
    new Set();

  /*
    الحساب الأساسي القديم:
    ADMIN_EMAIL
    ADMIN_PASSWORD
  */

  if (
    env.ADMIN_EMAIL &&
    env.ADMIN_PASSWORD
  ) {
    const email =
      env.ADMIN_EMAIL
        .trim()
        .toLowerCase();

    accounts.push({
      key: 'legacy',
      email,
      password:
        String(
          env.ADMIN_PASSWORD
        ),
    });

    usedEmails.add(
      email
    );
  }

  /*
    الحسابات الإضافية:
    ADMIN_EMAIL_2
    ADMIN_PASSWORD_2

    ADMIN_EMAIL_3
    ADMIN_PASSWORD_3
    ...
  */

  const indexes =
    Object.keys(
      env
    )
      .map(
        (key) => {
          const match =
            key.match(
              /^ADMIN_EMAIL_(\d+)$/
            );

          return match
            ? Number(
                match[1]
              )
            : null;
        }
      )
      .filter(
        (value) =>
          value !== null
      )
      .sort(
        (a, b) =>
          a - b
      );

  for (
    const index of indexes
  ) {
    const email =
      String(
        env[
          `ADMIN_EMAIL_${index}`
        ] || ''
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        env[
          `ADMIN_PASSWORD_${index}`
        ] || ''
      );

    if (
      !email ||
      !password ||
      usedEmails.has(
        email
      )
    ) {
      continue;
    }

    accounts.push({
      key:
        `indexed:${index}`,

      email,

      password,
    });

    usedEmails.add(
      email
    );
  }

  return accounts;
}

function saveEnvFile(
  updates = {}
) {
  const env =
    readEnvFile();

  Object.assign(
    env,
    updates
  );

  const lines =
    Object.entries(
      env
    ).map(
      ([key, value]) =>
        `${key}=${value}`
    );

  if (
    !lines.some(
      (line) =>
        line.startsWith(
          'PORT='
        )
    )
  ) {
    lines.unshift(
      'PORT=5173'
    );
  }

  fs.writeFileSync(
    ENV_FILE,
    `${lines.join(
      '\n'
    )}\n`,
    'utf8'
  );
}

export function getAdminEnv() {
  const port =
    getEnvValue(
      'PORT'
    ) ||
    '5173';

  const accounts =
    getAdminAccounts();

  if (
    !accounts.length
  ) {
    throw new Error(
      'No admin credentials found in .env'
    );
  }

  return {
    PORT:
      port,

    accounts,
  };
}


/* =========================================================
   HELPERS
   ========================================================= */

function sendJson(
  res,
  status,
  data
) {
  res.statusCode =
    status;

  res.setHeader(
    'Content-Type',
    'application/json; charset=utf-8'
  );

  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  res.end(
    JSON.stringify(
      data
    )
  );
}

function clean(
  value,
  max = 1000
) {
  return String(
    value ?? ''
  )
    .trim()
    .slice(
      0,
      max
    );
}

function toNumber(
  value,
  fallback = 0
) {
  const result =
    Number(
      value
    );

  return Number.isFinite(
    result
  )
    ? result
    : fallback;
}

async function readBody(
  req
) {
  let body =
    '';

  for await (
    const chunk of req
  ) {
    body += chunk;

    if (
      body.length >
      12 *
        1024 *
        1024
    ) {
      throw new Error(
        'BODY_TOO_LARGE'
      );
    }
  }

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(
      body
    );
  } catch {
    throw new Error(
      'INVALID_JSON'
    );
  }
}


/* =========================================================
   SESSION
   ========================================================= */

const sessions =
  new Map();

function parseCookies(
  req
) {
  const header =
    req.headers.cookie ||
    '';

  const cookies =
    {};

  for (
    const part of
      header.split(';')
  ) {
    const [
      key,
      ...rest
    ] =
      part
        .trim()
        .split('=');

    if (!key) {
      continue;
    }

    cookies[key] =
      decodeURIComponent(
        rest.join('=')
      );
  }

  return cookies;
}

function getSessionToken(
  req
) {
  return parseCookies(
    req
  ).bitehouse_session;
}

function getSession(
  req
) {
  const token =
    getSessionToken(
      req
    );

  return token
    ? sessions.get(
        token
      )
    : null;
}

function isAuthenticated(
  req
) {
  return Boolean(
    getSession(
      req
    )
  );
}

function requireAuth(
  req,
  res
) {
  if (
    !isAuthenticated(
      req
    )
  ) {
    sendJson(
      res,
      401,
      {
        message:
          'غير مصرح بالدخول.',
      }
    );

    return false;
  }

  return true;
}

function createSession(
  res,
  account
) {
  const token =
    crypto.randomUUID();

  sessions.set(
    token,
    {
      accountKey:
        account.key,

      email:
        account.email,

      createdAt:
        Date.now(),
    }
  );

  res.setHeader(
    'Set-Cookie',
    `bitehouse_session=${encodeURIComponent(
      token
    )}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`
  );
}

function destroySession(
  req,
  res
) {
  const token =
    getSessionToken(
      req
    );

  if (token) {
    sessions.delete(
      token
    );
  }

  res.setHeader(
    'Set-Cookie',
    'bitehouse_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'
  );
}

function getCurrentAccount(
  req
) {
  const session =
    getSession(
      req
    );

  if (!session) {
    return null;
  }

  return (
    getAdminAccounts().find(
      (account) =>
        account.key ===
          session.accountKey &&
        account.email ===
          session.email
    ) ||
    null
  );
}


/* =========================================================
   OFFERS CALCULATION
   ========================================================= */

function getOfferProductUnitPrice(product, size) {
  if (!product) return 0;
  const requested = size === 'L' ? product.largePrice : product.price;
  return requested !== '' && requested != null
    ? Math.max(0, toNumber(requested))
    : 0;
}

function normalizeOfferItems(offer) {
  const rawItems = Array.isArray(offer?.items) ? offer.items : [];

  if (rawItems.length) {
    return rawItems
      .map((item) => ({
        productId: Number(item?.productId),
        size: item?.size === 'L' ? 'L' : 'M',
        quantity: Math.max(1, Math.floor(toNumber(item?.quantity) || 1)),
      }))
      .filter((item) => Number.isFinite(item.productId));
  }

  const productIds = Array.isArray(offer?.productIds)
    ? offer.productIds.map(Number).filter(Number.isFinite)
    : [];

  return productIds.map((productId) => {
    const product = database.products.find((item) => Number(item.id) === productId);
    return {
      productId,
      size:
        product?.price !== '' && product?.price != null
          ? 'M'
          : 'L',
      quantity: 1,
    };
  });
}

function buildOfferDescription(items) {
  return items
    .map((item) => {
      const product = database.products.find(
        (candidate) => Number(candidate.id) === Number(item.productId)
      );
      if (!product) return '';
      const name = product.nameAr || product.name || 'صنف';
      return `${item.quantity} × ${name} (${item.size})`;
    })
    .filter(Boolean)
    .join(' + ');
}

function calculateOffer(
  offer,
  branchId = null
) {
  const rawItems = normalizeOfferItems(offer);

  const items = rawItems
    .map((item) => {
      const product = database.products.find(
        (candidate) => Number(candidate.id) === Number(item.productId)
      );

      if (!product) return null;

      const productBranchIds = normalizeBranchIds(
        product.branchIds,
        database.branches
      );

      if (branchId && !productBranchIds.includes(String(branchId))) {
        return null;
      }

      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const unitPrice = getOfferProductUnitPrice(product, item.size);

      return {
        productId: Number(item.productId),
        size: item.size === 'L' ? 'L' : 'M',
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
      };
    })
    .filter(Boolean);

  const products = items
    .map((item) =>
      database.products.find((product) => Number(product.id) === Number(item.productId))
    )
    .filter(Boolean);

  const originalTotal = items.reduce(
    (total, item) => total + item.totalPrice,
    0
  );

  const discountValue = Math.max(0, toNumber(offer.discountValue));

  const discountAmount =
    offer.discountType === 'percentage'
      ? (originalTotal * Math.min(100, discountValue)) / 100
      : Math.min(originalTotal, discountValue);

  const finalTotal = Math.max(0, originalTotal - discountAmount);

  return {
    originalTotal: Math.round(originalTotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalTotal: Math.round(finalTotal * 100) / 100,
    items,
    products,
    description: buildOfferDescription(items),
  };
}


/* =========================================================
   PUBLIC / ADMIN DATA
   ========================================================= */

function getPublicData(branchId = null) {
  const branches = database.branches.filter(
    (branch) => branch.isActive !== false
  );

  const selectedBranch = branchId
    ? branches.find((branch) => branch.id === branchId)
    : null;

  const matchesBranch = (item) =>
    !selectedBranch ||
    normalizeBranchIds(
      item?.branchIds,
      database.branches
    ).includes(selectedBranch.id);

  const categories = database.categories
    .filter(matchesBranch)
    .sort(
      (first, second) =>
        Number(first.sortOrder || 0) -
        Number(second.sortOrder || 0)
    );

  const products = database.products
    .filter(matchesBranch)
    .map((product) => ({
      ...product,
      category: getStoredProductCategoryId(product),
    }));

  const visibleProductIds = new Set(
    products.map((product) => Number(product.id))
  );

  const offers = database.offers
    .filter(
      (offer) =>
        offer.isActive !== false &&
        matchesBranch(offer)
    )
    .map((offer) => ({
      ...offer,
      ...calculateOffer(offer, selectedBranch?.id || null),
      productIds: Array.isArray(offer.productIds)
        ? offer.productIds.filter((id) =>
            visibleProductIds.has(Number(id))
          )
        : [],
    }));

  return {
    branches,
    selectedBranchId: selectedBranch?.id || null,
    categories,
    products,
    offers,
  };
}

function getAdminData(
  req
) {
  const session =
    getSession(
      req
    );

  return {
    branches:
      database.branches,

    categories:
      [
        ...database.categories,
      ].sort(
        (
          first,
          second
        ) =>
          Number(
            first.sortOrder ||
              0
          ) -
          Number(
            second.sortOrder ||
              0
          )
      ),

    products:
      database.products,

    offers:
      database.offers.map(
        (offer) => ({
          ...offer,

          ...calculateOffer(
            offer
          ),
        })
      ),

    currentAdminEmail:
      session?.email ||
      '',

    adminEmails:
      getAdminAccounts().map(
        (account) =>
          account.email
      ),
  };
}


/* =========================================================
   IMAGE
   ========================================================= */

function saveImage(
  dataUrl,
  originalName = 'image'
) {
  if (
    typeof dataUrl !==
    'string'
  ) {
    throw new Error(
      'INVALID_IMAGE'
    );
  }

  const match =
    dataUrl.match(
      /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/
    );

  if (!match) {
    throw new Error(
      'INVALID_IMAGE'
    );
  }

  const extension =
    match[1] === 'jpeg'
      ? 'jpg'
      : match[1];

  const buffer =
    Buffer.from(
      match[2],
      'base64'
    );

  if (
    buffer.length >
    6 *
      1024 *
      1024
  ) {
    throw new Error(
      'IMAGE_TOO_LARGE'
    );
  }

  const safeName =
    path
      .basename(
        originalName
      )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        '-'
      )
      .slice(
        0,
        40
      ) ||
    'image';

  const fileName =
    `${Date.now()}-${safeName}.${extension}`;

  fs.writeFileSync(
    path.join(
      UPLOAD_DIR,
      fileName
    ),
    buffer
  );

  return `/uploads/${fileName}`;
}


/* =========================================================
   CATEGORY ID
   ========================================================= */

function makeCategoryId(
  label
) {
  const base =
    label
      .toLowerCase()
      .replace(
        /[^a-z0-9\u0600-\u06ff]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      ) ||
    `category-${Date.now()}`;

  let id =
    base;

  let counter =
    2;

  while (
    database.categories.some(
      (category) =>
        category.id ===
        id
    )
  ) {
    id =
      `${base}-${counter++}`;
  }

  return id;
}


/* =========================================================
   NEXT ADMIN INDEX
   ========================================================= */

function nextAccountIndex(
  env
) {
  const indexes =
    Object.keys(
      env
    )
      .map(
        (key) => {
          const match =
            key.match(
              /^ADMIN_(?:EMAIL|PASSWORD)_(\d+)$/
            );

          return match
            ? Number(
                match[1]
              )
            : 0;
        }
      )
      .filter(
        Boolean
      );

  return (
    indexes.length
      ? Math.max(
          ...indexes
        )
      : 1
  ) + 1;
}


/* =========================================================
   API
   ========================================================= */

export async function handleApi(
  req,
  res
) {
  const url =
    new URL(
      req.url,
      'http://localhost'
    );

  const pathname =
    url.pathname;

  const method =
    req.method ||
    'GET';

  if (
    !pathname.startsWith(
      '/api/'
    )
  ) {
    return false;
  }

  try {
    /* =====================================================
       PUBLIC DATA
       ===================================================== */

    if (
      method ===
        'GET' &&
      pathname ===
        '/api/public/data'
    ) {
      const branchId =
        String(
          url.searchParams.get('branchId') || ''
        ).trim() || null;

      if (
        branchId &&
        !database.branches.some(
          (branch) =>
            branch.id === branchId &&
            branch.isActive !== false
        )
      ) {
        sendJson(
          res,
          404,
          { message: 'الفرع غير موجود.' }
        );
        return true;
      }

      sendJson(
        res,
        200,
        getPublicData(branchId)
      );

      return true;
    }


    /* =====================================================
       LOGIN
       ===================================================== */

    if (
      method ===
        'POST' &&
      pathname ===
        '/api/admin/login'
    ) {
      const body =
        await readBody(
          req
        );

      const email =
        clean(
          body.email,
          200
        ).toLowerCase();

      const password =
        String(
          body.password ||
            ''
        );

      const account =
        getAdminAccounts().find(
          (item) =>
            item.email ===
              email &&
            item.password ===
              password
        );

      if (!account) {
        sendJson(
          res,
          401,
          {
            message:
              'الإيميل أو كلمة المرور غير صحيحة.',
          }
        );

        return true;
      }

      createSession(
        res,
        account
      );

      sendJson(
        res,
        200,
        {
          ok: true,
          email:
            account.email,
        }
      );

      return true;
    }


    /* =====================================================
       SESSION CHECK
       ===================================================== */

    if (
      method ===
        'GET' &&
      pathname ===
        '/api/admin/me'
    ) {
      const session =
        getSession(
          req
        );

      sendJson(
        res,
        200,
        {
          authenticated:
            Boolean(
              session
            ),

          email:
            session?.email ||
            '',
        }
      );

      return true;
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    if (
      method ===
        'POST' &&
      pathname ===
        '/api/admin/logout'
    ) {
      destroySession(
        req,
        res
      );

      sendJson(
        res,
        200,
        {
          ok: true,
        }
      );

      return true;
    }


    /* =====================================================
       PROTECTED ROUTES
       ===================================================== */

    if (
      !requireAuth(
        req,
        res
      )
    ) {
      return true;
    }


    /* =====================================================
       ADMIN DATA
       ===================================================== */

    if (
      method ===
        'GET' &&
      pathname ===
        '/api/admin/data'
    ) {
      sendJson(
        res,
        200,
        getAdminData(
          req
        )
      );

      return true;
    }


    /* =====================================================
       ADMIN ACCOUNTS
       ===================================================== */

    if (
      method ===
        'GET' &&
      pathname ===
        '/api/admin/accounts'
    ) {
      sendJson(
        res,
        200,
        {
          accounts:
            getAdminAccounts().map(
              (account) =>
                account.email
            ),
        }
      );

      return true;
    }


    /* =====================================================
       IMAGE UPLOAD
       ===================================================== */

    if (
      method ===
        'POST' &&
      pathname ===
        '/api/admin/upload-image'
    ) {
      const body =
        await readBody(
          req
        );

      const image =
        saveImage(
          body.dataUrl,
          body.fileName
        );

      sendJson(
        res,
        201,
        {
          path:
            image,
        }
      );

      return true;
    }


    /* =====================================================
       BRANCH CREATE
       ===================================================== */

    if (
      method ===
        'POST' &&
      pathname ===
        '/api/admin/branches'
    ) {
      const body = await readBody(req);
      const name = clean(body.name, 120);
      const englishName = clean(body.englishName, 120);
      const address = clean(body.address, 240);

      if (!name || !address) {
        sendJson(res, 400, { message: 'اسم الفرع والعنوان مطلوبان.' });
        return true;
      }

      if (database.branches.some((branch) => branch.name.toLowerCase() === name.toLowerCase())) {
        sendJson(res, 400, { message: 'الفرع ده مضاف بالفعل.' });
        return true;
      }

      const branch = {
        id: makeBranchId(name),
        name,
        englishName,
        address,
        isActive: true,
      };

      database.branches.push(branch);
      saveDatabase();
      sendJson(res, 201, branch);
      return true;
    }


    /* =====================================================
       CATEGORY CREATE
       ===================================================== */

    if (
      method ===
        'POST' &&
      pathname ===
        '/api/admin/categories'
    ) {
      const body =
        await readBody(
          req
        );

      const label =
        clean(
          body.label,
          100
        );

      const englishName =
        clean(
          body.englishName,
          100
        );

      const branchIds =
        normalizeBranchIds(
          body.branchIds,
          database.branches
        );

      if (!label) {
        sendJson(
          res,
          400,
          {
            message:
              'اسم القسم مطلوب.',
          }
        );

        return true;
      }

      if (!branchIds.length) {
        sendJson(res, 400, { message: 'اختاري فرعًا واحدًا على الأقل.' });
        return true;
      }

      const category = {
        id:
          makeCategoryId(
            label
          ),

        label,

        englishName,

        branchIds,

        sortOrder:
          database.categories
            .length + 1,
      };

      database.categories.push(
        category
      );

      saveDatabase();

      sendJson(
        res,
        201,
        category
      );

      return true;
    }


    /* =====================================================
       CATEGORY UPDATE / DELETE
       ===================================================== */

    const categoryMatch =
      pathname.match(
        /^\/api\/admin\/categories\/([^/]+)$/
      );

    if (
      categoryMatch
    ) {
      const id =
        decodeURIComponent(
          categoryMatch[1]
        );

      const category =
        database.categories.find(
          (item) =>
            item.id ===
            id
        );

      if (!category) {
        sendJson(
          res,
          404,
          {
            message:
              'القسم غير موجود.',
          }
        );

        return true;
      }


      /* UPDATE */

      if (
        method ===
        'PUT'
      ) {
        const body =
          await readBody(
            req
          );

        const label =
          clean(
            body.label,
            100
          );

        const englishName =
          clean(
            body.englishName,
            100
          );

        const branchIds =
          normalizeBranchIds(
            body.branchIds,
            database.branches
          );

        if (!label) {
          sendJson(
            res,
            400,
            {
              message:
                'اسم القسم مطلوب.',
            }
          );

          return true;
        }

        category.label =
          label;

        category.englishName =
          englishName;

        if (!branchIds.length) {
          sendJson(res, 400, { message: 'اختاري فرعًا واحدًا على الأقل.' });
          return true;
        }

        category.branchIds =
          branchIds;

        saveDatabase();

        sendJson(
          res,
          200,
          category
        );

        return true;
      }


      /* DELETE
         مع الأصناف
      */

      if (
        method ===
        'DELETE'
      ) {
        const removedProductIds =
          database.products
            .filter(
              (product) =>
                product.category ===
                id
            )
            .map(
              (product) =>
                Number(
                  product.id
                )
            );

        database.products =
          database.products.filter(
            (product) =>
              product.category !==
              id
          );

        database.offers =
          database.offers
            .map(
              (offer) => ({
                ...offer,

                productIds:
                  Array.isArray(
                    offer.productIds
                  )
                    ? offer.productIds.filter(
                        (
                          productId
                        ) =>
                          !removedProductIds.includes(
                            Number(
                              productId
                            )
                          )
                      )
                    : [],
              })
            )
            .filter(
              (offer) =>
                offer.productIds
                  .length >
                0
            );

        database.categories =
          database.categories.filter(
            (item) =>
              item.id !==
              id
          );

        database.categories.forEach(
          (
            item,
            index
          ) => {
            item.sortOrder =
              index + 1;
          }
        );

        saveDatabase();

        sendJson(
          res,
          200,
          {
            ok: true,

            deletedProducts:
              removedProductIds.length,
          }
        );

        return true;
      }
    }


    /* =====================================================
       PRODUCT CREATE
       ===================================================== */

    if (
      method ===
        'POST' &&
      pathname ===
        '/api/admin/products'
    ) {
      const body =
        await readBody(
          req
        );

      const name =
        clean(
          body.name,
          100
        );

      const nameAr =
        clean(
          body.nameAr,
          100
        );

      const description =
        clean(
          body.description,
          500
        );

      const category =
        clean(
          body.category,
          100
        );

      const branchIds =
        normalizeBranchIds(
          body.branchIds,
          database.branches
        );

      const rawPrice = String(body.price ?? '').trim();
      const rawLargePrice = String(body.largePrice ?? '').trim();
      const hasPrice = rawPrice !== '';
      const hasLargePrice = rawLargePrice !== '';

      const price = hasPrice
        ? toNumber(rawPrice, -1)
        : null;

      const largePrice = hasLargePrice
        ? toNumber(rawLargePrice, -1)
        : null;

      if (
        !name ||
        !nameAr ||
        (!hasPrice && !hasLargePrice) ||
        (hasPrice && price < 0) ||
        (hasLargePrice && largePrice < 0)
      ) {
        sendJson(
          res,
          400,
          {
            message:
              'بيانات الصنف غير صحيحة.',
          }
        );

        return true;
      }

      if (
        !database.categories.some(
          (item) =>
            item.id ===
            category
        )
      ) {
        sendJson(
          res,
          400,
          {
            message:
              'اختاري قسمًا صحيحًا.',
          }
        );

        return true;
      }

      if (!branchIds.length) {
        sendJson(res, 400, { message: 'اختاري فرعًا واحدًا على الأقل.' });
        return true;
      }

      const categoryRecord = database.categories.find(
        (item) => item.id === category
      );
      const categoryBranchIds = normalizeBranchIds(
        categoryRecord?.branchIds,
        database.branches
      );

      if (branchIds.some((id) => !categoryBranchIds.includes(id))) {
        sendJson(res, 400, { message: 'الفروع المختارة للصنف لازم تكون موجودة في نفس القسم.' });
        return true;
      }

      const product = {
        id:
          Date.now(),

        name,

        nameAr,

        description,

        category,

        branchIds,

        price,

        largePrice,

        sizes: [
          ...(price !== null ? [price] : []),
          ...(largePrice !== null ? [largePrice] : []),
        ],

        badge:
          clean(
            body.badge,
            80
          ),

        image:
          clean(
            body.image,
            500
          ),

        isAvailable:
          body.isAvailable !==
          false,
      };

      database.products.push(
        product
      );

      saveDatabase();

      sendJson(
        res,
        201,
        product
      );

      return true;
    }


    /* =====================================================
       PRODUCT UPDATE / DELETE
       ===================================================== */

    const productMatch =
      pathname.match(
        /^\/api\/admin\/products\/(\d+)$/
      );

    if (
      productMatch
    ) {
      const id =
        Number(
          productMatch[1]
        );

      const product =
        database.products.find(
          (item) =>
            Number(
              item.id
            ) === id
        );

      if (!product) {
        sendJson(
          res,
          404,
          {
            message:
              'الصنف غير موجود.',
          }
        );

        return true;
      }


      /* UPDATE */

      if (
        method ===
        'PUT'
      ) {
        const body =
          await readBody(
            req
          );

        const name =
          clean(
            body.name,
            100
          );

        const nameAr =
          clean(
            body.nameAr,
            100
          );

        const description =
          clean(
            body.description,
            500
          );

        const category =
          clean(
            body.category,
            100
          );

        const branchIds =
          normalizeBranchIds(
            body.branchIds,
            database.branches
          );

        const rawPrice = String(body.price ?? '').trim();
        const rawLargePrice = String(body.largePrice ?? '').trim();
        const hasPrice = rawPrice !== '';
        const hasLargePrice = rawLargePrice !== '';

        const price = hasPrice
          ? toNumber(rawPrice, -1)
          : null;

        const largePrice = hasLargePrice
          ? toNumber(rawLargePrice, -1)
          : null;

        if (
          !name ||
          !nameAr ||
          (!hasPrice && !hasLargePrice) ||
          (hasPrice && price < 0) ||
          (hasLargePrice && largePrice < 0)
        ) {
          sendJson(
            res,
            400,
            {
              message:
                'بيانات الصنف غير صحيحة.',
            }
          );

          return true;
        }

        if (
          !database.categories.some(
            (item) =>
              item.id ===
              category
          )
        ) {
          sendJson(
            res,
            400,
            {
              message:
                'اختاري قسمًا صحيحًا.',
            }
          );

          return true;
        }

        if (!branchIds.length) {
          sendJson(res, 400, { message: 'اختاري فرعًا واحدًا على الأقل.' });
          return true;
        }

        const categoryRecord = database.categories.find(
          (item) => item.id === category
        );
        const categoryBranchIds = normalizeBranchIds(
          categoryRecord?.branchIds,
          database.branches
        );

        if (branchIds.some((id) => !categoryBranchIds.includes(id))) {
          sendJson(res, 400, { message: 'الفروع المختارة للصنف لازم تكون موجودة في نفس القسم.' });
          return true;
        }

        Object.assign(
          product,
          {
            name,

            nameAr,

            description,

            category,

            branchIds,

            price,

            largePrice,

            sizes: [
              ...(price !== null ? [price] : []),
              ...(largePrice !== null ? [largePrice] : []),
            ],

            badge:
              clean(
                body.badge,
                80
              ),

            image:
              clean(
                body.image,
                500
              ),

            isAvailable:
              body.isAvailable !==
              false,
          }
        );

        saveDatabase();

        sendJson(
          res,
          200,
          product
        );

        return true;
      }


      /* DELETE */

      if (
        method ===
        'DELETE'
      ) {
        database.products =
          database.products.filter(
            (item) =>
              Number(
                item.id
              ) !== id
          );

        database.offers =
          database.offers
            .map(
              (offer) => ({
                ...offer,

                productIds:
                  Array.isArray(
                    offer.productIds
                  )
                    ? offer.productIds.filter(
                        (
                          productId
                        ) =>
                          Number(
                            productId
                          ) !==
                          id
                      )
                    : [],
              })
            )
            .filter(
              (offer) =>
                offer.productIds
                  .length >
                0
            );

        saveDatabase();

        sendJson(
          res,
          200,
          {
            ok: true,
          }
        );

        return true;
      }
    }


    /* =====================================================
       PRODUCT TOGGLE
       ===================================================== */

    const productToggle =
      pathname.match(
        /^\/api\/admin\/products\/(\d+)\/toggle$/
      );

    if (
      productToggle &&
      method ===
        'PATCH'
    ) {
      const id =
        Number(
          productToggle[1]
        );

      const product =
        database.products.find(
          (item) =>
            Number(
              item.id
            ) === id
        );

      if (!product) {
        sendJson(
          res,
          404,
          {
            message:
              'الصنف غير موجود.',
          }
        );

        return true;
      }

      product.isAvailable =
        !product.isAvailable;

      saveDatabase();

      sendJson(
        res,
        200,
        product
      );

      return true;
    }


    /* =====================================================
       OFFER CREATE
       ===================================================== */

    if (
      method ===
        'POST' &&
      pathname ===
        '/api/admin/offers'
    ) {
      const body =
        await readBody(
          req
        );

      const title =
        clean(
          body.title,
          120
        );

      const branchIds =
        normalizeBranchIds(
          body.branchIds,
          database.branches
        );

      const rawItems = Array.isArray(body.items) ? body.items : [];

      const items = rawItems.length
        ? rawItems
            .map((item) => ({
              productId: Number(item?.productId),
              size: item?.size === 'L' ? 'L' : 'M',
              quantity: Math.floor(Number(item?.quantity) || 0),
            }))
            .filter((item) => Number.isFinite(item.productId))
        : (Array.isArray(body.productIds)
            ? [...new Set(body.productIds.map(Number).filter(Number.isFinite))].map((productId) => ({
                productId,
                size: 'M',
                quantity: 1,
              }))
            : []);

      const productIds = [
        ...new Set(items.map((item) => Number(item.productId))),
      ];

      const discountType =
        body.discountType ===
        'fixed'
          ? 'fixed'
          : 'percentage';

      const discountValue =
        Math.max(
          0,
          toNumber(
            body.discountValue
          )
        );

      if (!title) {
        sendJson(
          res,
          400,
          {
            message:
              'اسم العرض مطلوب.',
          }
        );

        return true;
      }

      if (!items.length) {
        sendJson(res, 400, { message: 'اختاري صنفًا واحدًا على الأقل.' });
        return true;
      }

      if (items.some((item) => item.quantity < 1 || !Number.isInteger(item.quantity))) {
        sendJson(res, 400, { message: 'عدد كل صنف في العرض يجب أن يكون 1 أو أكثر.' });
        return true;
      }

      if (
        discountType ===
          'percentage' &&
        discountValue >
          100
      ) {
        sendJson(
          res,
          400,
          {
            message:
              'نسبة الخصم لا يمكن أن تتجاوز 100%.',
          }
        );

        return true;
      }

      if (!branchIds.length) {
        sendJson(res, 400, { message: 'اختاري فرعًا واحدًا على الأقل.' });
        return true;
      }

      const validIds =
        new Set(
          database.products.map(
            (item) =>
              Number(
                item.id
              )
          )
        );

      if (
        productIds.some(
          (id) =>
            !validIds.has(
              id
            )
        )
      ) {
        sendJson(
          res,
          400,
          {
            message:
              'يوجد صنف غير موجود.',
          }
        );

        return true;
      }

      const selectedOfferProducts = database.products.filter((product) =>
        productIds.includes(Number(product.id))
      );

      const invalidOfferItem = items.find((item) => {
        const product = selectedOfferProducts.find(
          (candidate) => Number(candidate.id) === Number(item.productId)
        );

        if (!product) return true;

        const productBranchIds = normalizeBranchIds(
          product.branchIds,
          database.branches
        );

        const availableInBranch = branchIds.some((branchId) =>
          productBranchIds.includes(branchId)
        );

        const sizeAvailable =
          item.size === 'L'
            ? product.largePrice !== '' && product.largePrice != null
            : product.price !== '' && product.price != null;

        return !availableInBranch || !sizeAvailable;
      });

      if (invalidOfferItem) {
        sendJson(res, 400, {
          message: 'تأكدي أن كل صنف مختار متاح في الفروع المحددة وله سعر للحجم المختار.',
        });
        return true;
      }

      const offer = {
        id:
          Date.now(),

        title,

        description: buildOfferDescription(items),

        image:
          clean(
            body.image,
            500
          ),

        branchIds,

        productIds,

        items,

        discountType,

        discountValue,

        isActive:
          body.isActive !==
          false,

        createdAt:
          new Date().toISOString(),

        updatedAt:
          new Date().toISOString(),
      };

      database.offers.push(
        offer
      );

      saveDatabase();

      sendJson(
        res,
        201,
        {
          ...offer,

          ...calculateOffer(
            offer
          ),
        }
      );

      return true;
    }


    /* =====================================================
       OFFER UPDATE / DELETE
       ===================================================== */

    const offerMatch =
      pathname.match(
        /^\/api\/admin\/offers\/(\d+)$/
      );

    if (
      offerMatch
    ) {
      const id =
        Number(
          offerMatch[1]
        );

      const offer =
        database.offers.find(
          (item) =>
            Number(
              item.id
            ) === id
        );

      if (!offer) {
        sendJson(
          res,
          404,
          {
            message:
              'العرض غير موجود.',
          }
        );

        return true;
      }


      /* UPDATE */

      if (
        method ===
        'PUT'
      ) {
        const body =
          await readBody(
            req
          );

        const title =
          clean(
            body.title,
            120
          );

        const branchIds =
          normalizeBranchIds(
            body.branchIds,
            database.branches
          );

        const rawItems = Array.isArray(body.items) ? body.items : [];

        const items = rawItems.length
          ? rawItems
              .map((item) => ({
                productId: Number(item?.productId),
                size: item?.size === 'L' ? 'L' : 'M',
                quantity: Math.floor(Number(item?.quantity) || 0),
              }))
              .filter((item) => Number.isFinite(item.productId))
          : (Array.isArray(body.productIds)
              ? [...new Set(body.productIds.map(Number).filter(Number.isFinite))].map((productId) => ({
                  productId,
                  size: 'M',
                  quantity: 1,
                }))
              : []);

        const productIds = [
          ...new Set(items.map((item) => Number(item.productId))),
        ];

        const discountType =
          body.discountType ===
          'fixed'
            ? 'fixed'
            : 'percentage';

        const discountValue =
          Math.max(
            0,
            toNumber(
              body.discountValue
            )
          );

        if (!title) {
          sendJson(
            res,
            400,
            {
              message:
                'اسم العرض مطلوب.',
            }
          );

          return true;
        }

        if (!items.length) {
          sendJson(res, 400, { message: 'اختاري صنفًا واحدًا على الأقل.' });
          return true;
        }

        if (items.some((item) => item.quantity < 1 || !Number.isInteger(item.quantity))) {
          sendJson(res, 400, { message: 'عدد كل صنف في العرض يجب أن يكون 1 أو أكثر.' });
          return true;
        }

        if (
          discountType ===
            'percentage' &&
          discountValue >
            100
        ) {
          sendJson(
            res,
            400,
            {
              message:
                'نسبة الخصم لا يمكن أن تتجاوز 100%.',
            }
          );

          return true;
        }

        if (!branchIds.length) {
          sendJson(res, 400, { message: 'اختاري فرعًا واحدًا على الأقل.' });
          return true;
        }

        const selectedOfferProducts = database.products.filter((product) =>
          productIds.includes(Number(product.id))
        );

        const invalidOfferItem = items.find((item) => {
          const product = selectedOfferProducts.find(
            (candidate) => Number(candidate.id) === Number(item.productId)
          );

          if (!product) return true;

          const productBranchIds = normalizeBranchIds(
            product.branchIds,
            database.branches
          );

          const availableInBranch = branchIds.some((branchId) =>
            productBranchIds.includes(branchId)
          );

          const sizeAvailable =
            item.size === 'L'
              ? product.largePrice !== '' && product.largePrice != null
              : product.price !== '' && product.price != null;

          return !availableInBranch || !sizeAvailable;
        });

        if (invalidOfferItem) {
          sendJson(res, 400, {
            message: 'تأكدي أن كل صنف مختار متاح في الفروع المحددة وله سعر للحجم المختار.',
          });
          return true;
        }

        const validIds =
          new Set(
            database.products.map(
              (item) =>
                Number(
                  item.id
                )
            )
          );

        if (
          productIds.some(
            (
              productId
            ) =>
              !validIds.has(
                productId
              )
          )
        ) {
          sendJson(
            res,
            400,
            {
              message:
                'يوجد صنف غير موجود.',
            }
          );

          return true;
        }

        Object.assign(
          offer,
          {
            title,

            description:
              buildOfferDescription(items),

            image:
              clean(
                body.image,
                500
              ),

            branchIds,

            productIds,

            items,

            discountType,

            discountValue,

            isActive:
              body.isActive !==
              false,

            updatedAt:
              new Date().toISOString(),
          }
        );

        saveDatabase();

        sendJson(
          res,
          200,
          {
            ...offer,

            ...calculateOffer(
              offer
            ),
          }
        );

        return true;
      }


      /* DELETE */

      if (
        method ===
        'DELETE'
      ) {
        database.offers =
          database.offers.filter(
            (item) =>
              Number(
                item.id
              ) !== id
          );

        saveDatabase();

        sendJson(
          res,
          200,
          {
            ok: true,
          }
        );

        return true;
      }
    }


    /* =====================================================
       OFFER TOGGLE
       ===================================================== */

    const offerToggle =
      pathname.match(
        /^\/api\/admin\/offers\/(\d+)\/toggle$/
      );

    if (
      offerToggle &&
      method ===
        'PATCH'
    ) {
      const id =
        Number(
          offerToggle[1]
        );

      const offer =
        database.offers.find(
          (item) =>
            Number(
              item.id
            ) === id
        );

      if (!offer) {
        sendJson(
          res,
          404,
          {
            message:
              'العرض غير موجود.',
          }
        );

        return true;
      }

      offer.isActive =
        !offer.isActive;

      offer.updatedAt =
        new Date().toISOString();

      saveDatabase();

      sendJson(
        res,
        200,
        {
          ...offer,

          ...calculateOffer(
            offer
          ),
        }
      );

      return true;
    }


    /* =====================================================
       CHANGE CURRENT PASSWORD
       ===================================================== */

    if (
      method ===
        'PUT' &&
      pathname ===
        '/api/admin/credentials/change-password'
    ) {
      const currentAccount =
        getCurrentAccount(
          req
        );

      if (
        !currentAccount
      ) {
        sendJson(
          res,
          401,
          {
            message:
              'جلسة الدخول غير صالحة.',
          }
        );

        return true;
      }

      const body =
        await readBody(
          req
        );

      const email =
        clean(
          body.email,
          200
        ).toLowerCase();

      const currentPassword =
        String(
          body.currentPassword ||
            ''
        );

      const newPassword =
        String(
          body.newPassword ||
            ''
        );

      if (
        email !==
        currentAccount.email
      ) {
        sendJson(
          res,
          400,
          {
            message:
              'الإيميل لازم يكون إيميل الحساب الحالي.',
          }
        );

        return true;
      }

      if (
        currentPassword !==
        currentAccount.password
      ) {
        sendJson(
          res,
          400,
          {
            message:
              'الباسورد القديم غير صحيح.',
          }
        );

        return true;
      }

      if (
        newPassword.length <
        8
      ) {
        sendJson(
          res,
          400,
          {
            message:
              'الباسورد الجديد يجب أن يكون 8 أحرف على الأقل.',
          }
        );

        return true;
      }

      const env =
        readEnvFile();

      if (
        currentAccount.key ===
        'legacy'
      ) {
        env.ADMIN_PASSWORD =
          newPassword;
      } else {
        const index =
          currentAccount.key.replace(
            'indexed:',
            ''
          );

        env[
          `ADMIN_PASSWORD_${index}`
        ] =
          newPassword;
      }

      saveEnvFile(
        env
      );

      sendJson(
        res,
        200,
        {
          ok: true,

          message:
            'تم حفظ الباسورد الجديد بنجاح.',
        }
      );

      return true;
    }


    /* =====================================================
       ADD NEW ADMIN
       ===================================================== */

    if (
      method ===
        'POST' &&
      pathname ===
        '/api/admin/credentials/add'
    ) {
      const body =
        await readBody(
          req
        );

      const email =
        clean(
          body.email,
          200
        ).toLowerCase();

      const password =
        String(
          body.password ||
            ''
        );

      if (
        !email ||
        !email.includes(
          '@'
        )
      ) {
        sendJson(
          res,
          400,
          {
            message:
              'اكتبي إيميل صحيح.',
          }
        );

        return true;
      }

      if (
        password.length <
        8
      ) {
        sendJson(
          res,
          400,
          {
            message:
              'الباسورد يجب أن يكون 8 أحرف على الأقل.',
          }
        );

        return true;
      }

      if (
        getAdminAccounts().some(
          (account) =>
            account.email ===
            email
        )
      ) {
        sendJson(
          res,
          400,
          {
            message:
              'الإيميل ده مضاف بالفعل.',
          }
        );

        return true;
      }

      const env =
        readEnvFile();

      const index =
        nextAccountIndex(
          env
        );

      saveEnvFile({
        [`ADMIN_EMAIL_${index}`]:
          email,

        [`ADMIN_PASSWORD_${index}`]:
          password,
      });

      sendJson(
        res,
        201,
        {
          ok: true,

          email,

          message:
            'تمت إضافة حساب جديد للداشبورد.',
        }
      );

      return true;
    }


    /* =====================================================
       UNKNOWN ROUTE
       ===================================================== */

    sendJson(
      res,
      404,
      {
        message:
          'المسار غير موجود.',
      }
    );

    return true;
  } catch (error) {
    console.error(
      'API Error:',
      error
    );

    const messages = {
      BODY_TOO_LARGE:
        'حجم الطلب كبير جدًا.',

      INVALID_JSON:
        'بيانات الطلب غير صحيحة.',

      INVALID_IMAGE:
        'الصورة غير صالحة. استخدمي PNG أو JPG أو WebP.',

      IMAGE_TOO_LARGE:
        'حجم الصورة كبير جدًا.',
    };

    sendJson(
      res,
      400,
      {
        message:
          messages[
            error.message
          ] ||
          'حدث خطأ في السيرفر.',
      }
    );

    return true;
  }
}