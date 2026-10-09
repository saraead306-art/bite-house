import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DB_FILE = path.join(ROOT, 'data', 'db.json');
const UPLOAD_DIR = path.join(ROOT, 'public', 'uploads');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabase settings are missing from .env');
  console.error('Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!fs.existsSync(DB_FILE)) {
  console.error(`❌ db.json was not found: ${DB_FILE}`);
  process.exit(1);
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.png') return 'image/png';
  if (ext === '.jpg') return 'image/jpeg';
  if (ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';

  return 'application/octet-stream';
}

async function uploadImages(data) {
  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log('ℹ️ public/uploads not found. Skipping image upload.');
    return data;
  }

  const files = fs
    .readdirSync(UPLOAD_DIR, { withFileTypes: true })
    .filter((item) => item.isFile());

  console.log(`📦 Found ${files.length} files in public/uploads`);

  const urlMap = {};

  for (const file of files) {
    const fileName = file.name;
    const localFile = path.join(UPLOAD_DIR, fileName);
    const storageFile = `uploads/${fileName}`;

    console.log(`⬆️ Uploading ${fileName}`);

    const fileBuffer = fs.readFileSync(localFile);

    const uploadResult = await supabase.storage
      .from('bite-house-images')
      .upload(storageFile, fileBuffer, {
        contentType: getContentType(fileName),
        upsert: true,
        cacheControl: '31536000',
      });

    if (uploadResult.error) {
      throw new Error(
        `Upload failed for ${fileName}: ${uploadResult.error.message}`
      );
    }

    const publicResult = supabase.storage
      .from('bite-house-images')
      .getPublicUrl(storageFile);

    urlMap[`/uploads/${fileName}`] = publicResult.data.publicUrl;
  }

  function replaceUrls(value) {
    if (typeof value === 'string') {
      return urlMap[value] || value;
    }

    if (Array.isArray(value)) {
      return value.map(replaceUrls);
    }

    if (value && typeof value === 'object') {
      const result = {};

      for (const key of Object.keys(value)) {
        result[key] = replaceUrls(value[key]);
      }

      return result;
    }

    return value;
  }

  return replaceUrls(data);
}

async function saveDatabase(data) {
  console.log('💾 Saving db.json to Supabase...');

  const result = await supabase
    .from('bite_house_data')
    .upsert(
      {
        id: 1,
        data: data,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    );

  if (result.error) {
    throw new Error(
      `Database save failed: ${result.error.message}`
    );
  }

  console.log('✅ Database saved successfully.');
}

async function migrateAdmins() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('ℹ️ ADMIN_EMAIL / ADMIN_PASSWORD not found.');
    return;
  }

  console.log(`👤 Migrating admin: ${email}`);

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await supabase
    .from('admin_accounts')
    .upsert(
      {
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
      },
      {
        onConflict: 'email',
      }
    );

  if (result.error) {
    throw new Error(
      `Admin migration failed: ${result.error.message}`
    );
  }

  console.log('✅ Admin migrated successfully.');
}

async function main() {
  console.log('');
  console.log('======================================');
  console.log('     Bite House Supabase Migration');
  console.log('======================================');
  console.log('');

  console.log('📖 Reading data/db.json...');

  const dbText = fs.readFileSync(DB_FILE, 'utf8');
  const database = JSON.parse(dbText);

  console.log('✅ db.json loaded successfully.');

  const migratedDatabase = await uploadImages(database);

  await saveDatabase(migratedDatabase);

  await migrateAdmins();

  console.log('');
  console.log('======================================');
  console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
  console.log('======================================');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error('❌ MIGRATION FAILED');
  console.error(error.message);
  console.error('');
  process.exit(1);
});