import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

// Memory cache fallback
declare global {
  var __AGRI_DB_STATE__: any;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create data dir, using memory cache:', err);
  }
}

function loadServerDb() {
  if (globalThis.__AGRI_DB_STATE__) {
    return globalThis.__AGRI_DB_STATE__;
  }
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      globalThis.__AGRI_DB_STATE__ = data;
      return data;
    }
  } catch (err) {
    console.warn('Could not read db.json, returning null:', err);
  }
  return null;
}

function saveServerDb(data: any) {
  globalThis.__AGRI_DB_STATE__ = data;
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write db.json, data kept in memory:', err);
  }
}

export async function GET() {
  const data = loadServerDb();
  return NextResponse.json({
    success: true,
    hasData: Boolean(data),
    data: data || null,
    updatedAt: data?.updatedAt || null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const stateToSave = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    saveServerDb(stateToSave);

    return NextResponse.json({
      success: true,
      message: 'Database synced to central server successfully',
      updatedAt: stateToSave.updatedAt,
    });
  } catch (err: any) {
    console.error('Error saving central DB:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
