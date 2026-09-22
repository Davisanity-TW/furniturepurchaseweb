#!/usr/bin/env node

import { mkdir, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = "https://whjkvgjihtnvcgtsygst.supabase.co";
const SUPABASE_KEY = "sb_publishable_WkbLn0NqaCpoGmmD0ybqsA_pqdRZjqb";
const BACKUP_ROOT =
  process.env.FURNITURE_BACKUP_ROOT ||
  path.join(process.env.HOME || process.cwd(), "Backups", "furniture-purchase-web");

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(BACKUP_ROOT, timestamp);
const dataDir = path.join(backupDir, "data");

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) return `"${stringValue.replaceAll('"', '""')}"`;
  return stringValue;
}

function toCsv(rows) {
  const columns = [
    "id",
    "name",
    "category",
    "room",
    "brand",
    "model",
    "price",
    "currency",
    "url",
    "note",
    "status",
    "image_path",
    "purchased_at",
    "created_at",
    "updated_at",
  ];

  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`GET ${url} failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function listBackupDirs() {
  const entries = await readdir(BACKUP_ROOT, { withFileTypes: true }).catch(() => []);
  const dirs = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("20")) continue;
    const fullPath = path.join(BACKUP_ROOT, entry.name);
    const info = await stat(fullPath);
    dirs.push({ name: entry.name, path: fullPath, mtimeMs: info.mtimeMs });
  }

  return dirs.sort((a, b) => b.name.localeCompare(a.name));
}

async function moveOldBackupsToTrash(keepPath) {
  const trashRoot = path.join(
    process.env.HOME || process.cwd(),
    ".Trash",
    "furniture-purchase-web-old-backups",
  );
  await mkdir(trashRoot, { recursive: true });

  const pruned = [];
  for (const dir of await listBackupDirs()) {
    if (dir.path === keepPath) continue;

    const target = path.join(trashRoot, `${dir.name}-${Date.now()}`);
    await rename(dir.path, target);
    pruned.push({ backup_dir: dir.path, moved_to: target });
  }

  return pruned;
}

await mkdir(dataDir, { recursive: true });

const items = await fetchJson(
  `${SUPABASE_URL}/rest/v1/items?select=*&order=updated_at.asc`,
);

await writeFile(path.join(dataDir, "items.json"), `${JSON.stringify(items, null, 2)}\n`);
await writeFile(path.join(dataDir, "items.csv"), `${toCsv(items)}\n`);

const imagePaths = [...new Set(items.map((item) => item.image_path).filter(Boolean))];

const prunedBackups = await moveOldBackupsToTrash(backupDir);

const manifest = {
  backed_up_at: new Date().toISOString(),
  source: {
    app_url: "https://furniturepurchaseweb.vercel.app/items",
    supabase_url: SUPABASE_URL,
    tables: ["items"],
    storage_buckets: [],
  },
  backup_dir: backupDir,
  item_count: items.length,
  image_path_count: imagePaths.length,
  images_backed_up: false,
  pruned_backups: prunedBackups,
};

await writeFile(path.join(backupDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `Backed up ${items.length} items to ${backupDir}. Skipped ${imagePaths.length} image file(s). Moved ${prunedBackups.length} old backup(s) to Trash.`,
);
