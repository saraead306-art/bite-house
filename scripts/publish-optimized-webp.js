import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const BUCKET = 'bite-house-images';
const OPTIMIZED_DIR = path.join(ROOT, 'optimized-webp');
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOAD_SOURCE_DIR = path.join(PUBLIC_DIR, 'uploads');
const MEDIA_SOURCE_DIR = path.join(PUBLIC_DIR, 'media', 'products');
const LOCAL_DB_FILE = path.join(ROOT, 'data', 'db.json');
const SOURCE_DIR = path.join(ROOT, 'src');
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.bmp', '.tif', '.tiff'];

dotenv.config({ path: path.join(ROOT, '.env') });

function collectWebp(directory) {
  if (!fs.existsSync(directory)) return [];
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...collectWebp(fullPath));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.webp')) result.push(fullPath);
  }
  return result.sort();
}

function findOriginal(webpPath, sourceDirectory) {
  const stem = path.basename(webpPath, '.webp');
  for (const extension of IMAGE_EXTENSIONS) {
    const candidate = path.join(sourceDirectory, `${stem}${extension}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function getPathname(value) {
  try {
    return decodeURIComponent(new URL(value, 'https://local.invalid').pathname);
  } catch {
    return String(value).split(/[?#]/, 1)[0];
  }
}

function walkAndRewrite(value, uploadUrls, mediaUrls, stats) {
  if (typeof value === 'string') {
    const pathname = getPathname(value);
    const filename = path.posix.basename(pathname);
    if (pathname.includes('/media/products/') && mediaUrls.has(filename)) {
      stats.mediaRefs += 1;
      return mediaUrls.get(filename);
    }
    if ((pathname.includes('/uploads/') || pathname.startsWith('/uploads/')) && uploadUrls.has(filename)) {
      stats.uploadRefs += 1;
      return uploadUrls.get(filename);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => walkAndRewrite(item, uploadUrls, mediaUrls, stats));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, walkAndRewrite(item, uploadUrls, mediaUrls, stats)])
    );
  }
  return value;
}

function addOptimizedFolderToGitignore() {
  const file = path.join(ROOT, '.gitignore');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!current.split(/\r?\n/).some((line) => line.trim() === 'optimized-webp/')) {
    fs.appendFileSync(file, `${current && !current.endsWith('\n') ? '\n' : ''}optimized-webp/\n`, 'utf8');
  }
}

function updateSourceReferences(mediaOriginalToUrl) {
  if (!fs.existsSync(SOURCE_DIR)) return 0;
  const textExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.html']);
  let updatedFiles = 0;
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }
      if (!entry.isFile() || !textExtensions.has(path.extname(entry.name).toLowerCase())) continue;
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      for (const [oldName, newUrl] of mediaOriginalToUrl) {
        content = content.split(`/media/products/${oldName}`).join(newUrl);
      }
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        updatedFiles += 1;
      }
    }
  };
  visit(SOURCE_DIR);
  return updatedFiles;
}

async function main() {
  if (!fs.existsSync(OPTIMIZED_DIR)) {
    throw new Error('مجلد optimized-webp غير موجود. شغّلي convert-images-to-webp.py أولًا.');
  }
  const uploadFiles = collectWebp(path.join(OPTIMIZED_DIR, 'uploads'));
  const mediaFiles = collectWebp(path.join(OPTIMIZED_DIR, 'products'));
  if (!uploadFiles.length && !mediaFiles.length) {
    throw new Error('لم أجد ملفات WebP داخل optimized-webp/uploads أو optimized-webp/products.');
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  const supabaseKey = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('أضيفي SUPABASE_URL وSUPABASE_SECRET_KEY (أو SUPABASE_SERVICE_ROLE_KEY القديم) في ملف .env.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const uploadUrls = new Map();
  const mediaUrls = new Map();
  const mediaOriginalToUrl = new Map();

  console.log(`رفع ${uploadFiles.length + mediaFiles.length} صورة WebP إلى Supabase...`);

  for (const file of uploadFiles) {
    const original = findOriginal(file, UPLOAD_SOURCE_DIR);
    if (!original) throw new Error(`لم أجد الصورة الأصلية المطابقة لـ ${path.basename(file)} داخل public/uploads.`);
    const webpName = path.basename(file);
    const storagePath = `uploads/optimized/${webpName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fs.readFileSync(file), {
      contentType: 'image/webp', upsert: true, cacheControl: '31536000',
    });
    if (error) throw new Error(`فشل رفع ${webpName}: ${error.message}`);
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
    uploadUrls.set(path.basename(original), publicUrl);
    console.log(`✓ uploads: ${webpName}`);
  }

  for (const file of mediaFiles) {
    const original = findOriginal(file, MEDIA_SOURCE_DIR);
    if (!original) throw new Error(`لم أجد الصورة الأصلية المطابقة لـ ${path.basename(file)} داخل public/media/products.`);
    const webpName = path.basename(file);
    const storagePath = `media/products/optimized/${webpName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fs.readFileSync(file), {
      contentType: 'image/webp', upsert: true, cacheControl: '31536000',
    });
    if (error) throw new Error(`فشل رفع ${webpName}: ${error.message}`);
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
    mediaUrls.set(path.basename(original), publicUrl);
    mediaOriginalToUrl.set(path.basename(original), publicUrl);
    console.log(`✓ media: ${webpName}`);
  }

  const { data: row, error: readError } = await supabase
    .from('bite_house_data')
    .select('id,data')
    .eq('id', 1)
    .maybeSingle();
  if (readError) throw new Error(`تعذرت قراءة بيانات المنيو: ${readError.message}`);
  if (!row?.data) throw new Error('لم أجد سجل المنيو id=1 في bite_house_data. أوقفي هنا ولا ترفعي الصور يدويًا.');

  const stats = { uploadRefs: 0, mediaRefs: 0 };
  const updatedRemoteData = walkAndRewrite(row.data, uploadUrls, mediaUrls, stats);
  if (stats.uploadRefs + stats.mediaRefs > 0) {
    const { error } = await supabase
      .from('bite_house_data')
      .update({ data: updatedRemoteData, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) throw new Error(`رُفعت الصور لكن تعذر تحديث روابط المنيو: ${error.message}`);
  }

  const updatedFiles = updateSourceReferences(mediaOriginalToUrl);
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      const localData = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf8'));
      const localStats = { uploadRefs: 0, mediaRefs: 0 };
      const updatedLocalData = walkAndRewrite(localData, uploadUrls, mediaUrls, localStats);
      if (localStats.uploadRefs + localStats.mediaRefs > 0) {
        fs.writeFileSync(LOCAL_DB_FILE, `${JSON.stringify(updatedLocalData, null, 2)}\n`, 'utf8');
      }
    } catch (error) {
      console.warn(`تنبيه: لم أعدّل data/db.json المحلي: ${error.message}`);
    }
  }

  addOptimizedFolderToGitignore();
  console.log('\nاكتملت العملية. لم تُحذف الصور القديمة من Supabase أو من جهازك.');
  console.log(`روابط محدثة في Supabase: ${stats.uploadRefs + stats.mediaRefs} (${stats.uploadRefs} صور من uploads، ${stats.mediaRefs} صور من products).`);
  console.log(`ملفات الواجهة التي تغيّرت مراجع صورها: ${updatedFiles}.`);
  console.log('راجعي git status، ثم ارفعي تغييرات src و.gitignore وdata/db.json إن تغيّر. لا ترفعي optimized-webp؛ أُضيف إلى .gitignore.');
}

main().catch((error) => {
  console.error(`\nفشلت العملية: ${error.message}`);
  process.exitCode = 1;
});
