import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'app.db');

let _db: DatabaseSync | null = null;
let _initialized = false;

function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(dbPath);
    _db.exec('PRAGMA journal_mode = WAL;');
    _db.exec('PRAGMA busy_timeout = 5000;');
  }

  if (!_initialized) {
    _initialized = true;
    try {
      _db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          status TEXT NOT NULL DEFAULT 'pending',
          verification_token_hash TEXT,
          verification_token_expiry INTEGER,
          reset_token_hash TEXT,
          reset_token_expiry INTEGER,
          session_version INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS contact_submissions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          service TEXT,
          message TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `);

      // Seed default super admin if not present
      const existingAdmin = _db.prepare('SELECT id FROM users WHERE email = ?').get('admin@websitebuilders.com');
      if (!existingAdmin) {
        const salt = bcrypt.genSaltSync(12);
        const hash = bcrypt.hashSync('Admin@1234!', salt);
        const now = Date.now();
        _db.prepare(`
          INSERT OR IGNORE INTO users (id, email, password_hash, full_name, role, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          crypto.randomUUID(),
          'admin@websitebuilders.com',
          hash,
          'System Administrator',
          'superadmin',
          'verified',
          now,
          now
        );
      }
    } catch (e) {
      // If another process initialized concurrently, ignore
      console.warn('DB initialization note:', e);
    }
  }

  return _db;
}

// --- Zod schemas for DB operations (F-14) ---
const CreateUserDbSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  passwordHash: z.string(),
  fullName: z.string().min(1),
  role: z.enum(['user', 'admin', 'superadmin', 'staff']).default('user'),
  status: z.enum(['pending', 'verified']).default('pending'),
  verificationTokenHash: z.string().nullable().optional(),
  verificationTokenExpiry: z.number().nullable().optional(),
});

const ContactSubmissionDbSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  service: z.string().nullable().optional(),
  message: z.string().min(1),
});

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'user' | 'admin' | 'superadmin' | 'staff';
  status: 'pending' | 'verified';
  verification_token_hash?: string | null;
  verification_token_expiry?: number | null;
  reset_token_hash?: string | null;
  reset_token_expiry?: number | null;
  session_version: number;
  created_at: number;
  updated_at: number;
}

export interface ContactSubmissionRecord {
  id: string;
  user_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  message: string;
  created_at: number;
}

export const dbService = {
  // Find user by email with parameterized query
  findUserByEmail(email: string): UserRecord | null {
    z.string().email().parse(email);
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM users WHERE email = ?');
    return (stmt.get(email.toLowerCase().trim()) as unknown as UserRecord) || null;
  },

  // Find user by ID with parameterized query
  findUserById(id: string): UserRecord | null {
    z.string().uuid().parse(id);
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM users WHERE id = ?');
    return (stmt.get(id) as unknown as UserRecord) || null;
  },

  // Create user
  createUser(params: {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role?: 'user' | 'admin' | 'superadmin' | 'staff';
    status?: 'pending' | 'verified';
    verificationTokenHash?: string | null;
    verificationTokenExpiry?: number | null;
  }): UserRecord {
    const validated = CreateUserDbSchema.parse(params);
    const now = Date.now();
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO users (
        id, email, password_hash, full_name, role, status,
        verification_token_hash, verification_token_expiry, session_version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    stmt.run(
      validated.id,
      validated.email.toLowerCase().trim(),
      validated.passwordHash,
      validated.fullName,
      validated.role || 'user',
      validated.status || 'pending',
      validated.verificationTokenHash || null,
      validated.verificationTokenExpiry || null,
      now,
      now
    );

    return this.findUserById(validated.id)!;
  },

  // Update verification status
  verifyUserEmail(userId: string): void {
    z.string().uuid().parse(userId);
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE users
      SET status = 'verified', verification_token_hash = NULL, verification_token_expiry = NULL, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(Date.now(), userId);
  },

  // Update verification token
  updateVerificationToken(userId: string, tokenHash: string, expiry: number): void {
    z.string().uuid().parse(userId);
    z.string().min(10).parse(tokenHash);
    z.number().positive().parse(expiry);
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE users
      SET verification_token_hash = ?, verification_token_expiry = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(tokenHash, expiry, Date.now(), userId);
  },

  // Set password reset token
  setResetToken(userId: string, tokenHash: string, expiry: number): void {
    z.string().uuid().parse(userId);
    z.string().min(10).parse(tokenHash);
    z.number().positive().parse(expiry);
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE users
      SET reset_token_hash = ?, reset_token_expiry = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(tokenHash, expiry, Date.now(), userId);
  },

  // Find user by reset token hash
  findUserByResetTokenHash(tokenHash: string): UserRecord | null {
    z.string().min(10).parse(tokenHash);
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM users WHERE reset_token_hash = ?');
    return (stmt.get(tokenHash) as unknown as UserRecord) || null;
  },

  // Find user by verification token hash
  findUserByVerificationTokenHash(tokenHash: string): UserRecord | null {
    z.string().min(10).parse(tokenHash);
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM users WHERE verification_token_hash = ?');
    return (stmt.get(tokenHash) as unknown as UserRecord) || null;
  },

  // Reset password & invalidate all sessions (session_version + 1)
  resetPassword(userId: string, newPasswordHash: string): void {
    z.string().uuid().parse(userId);
    z.string().min(10).parse(newPasswordHash);
    const database = getDb();
    const stmt = database.prepare(`
      UPDATE users
      SET password_hash = ?, reset_token_hash = NULL, reset_token_expiry = NULL,
          session_version = session_version + 1, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(newPasswordHash, Date.now(), userId);
  },

  // Save contact submission (F-09: UUID submission ID)
  createContactSubmission(params: {
    id: string;
    userId?: string | null;
    name: string;
    email: string;
    phone?: string | null;
    service?: string | null;
    message: string;
  }): ContactSubmissionRecord {
    const validated = ContactSubmissionDbSchema.parse(params);
    const now = Date.now();
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO contact_submissions (id, user_id, name, email, phone, service, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      validated.id,
      validated.userId || null,
      validated.name,
      validated.email.toLowerCase().trim(),
      validated.phone || null,
      validated.service || null,
      validated.message,
      now
    );

    return {
      id: validated.id,
      user_id: validated.userId || null,
      name: validated.name,
      email: validated.email,
      phone: validated.phone || null,
      service: validated.service || null,
      message: validated.message,
      created_at: now,
    };
  },

  // Find submission by ID
  findSubmissionById(id: string): ContactSubmissionRecord | null {
    z.string().uuid().parse(id);
    const database = getDb();
    const stmt = database.prepare('SELECT * FROM contact_submissions WHERE id = ?');
    return (stmt.get(id) as unknown as ContactSubmissionRecord) || null;
  },
};
