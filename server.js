import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import session from 'express-session'
import SQLiteStoreFactory from 'connect-sqlite3'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import QRCode from 'qrcode'
import { z } from 'zod'

const root = process.cwd()
const isVercel = Boolean(process.env.VERCEL)
const port = Number(process.env.PORT || 3000)
const appOrigin = process.env.APP_ORIGIN || `http://localhost:${port}`
const app = express()
const runtimeDir = isVercel ? '/tmp' : root
const uploadsDir = path.join(runtimeDir, 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })
const db = new Database(path.join(runtimeDir, 'yugam.sqlite'))
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT, application_id TEXT UNIQUE NOT NULL, player_name TEXT NOT NULL,
    minecraft_username TEXT NOT NULL, minecraft_uuid TEXT NOT NULL, discord_username TEXT NOT NULL,
    discord_id TEXT NOT NULL, server_mode TEXT NOT NULL, player_bio TEXT NOT NULL, email TEXT,
    photo_path TEXT, status TEXT NOT NULL DEFAULT 'PENDING', admin_message TEXT, rejection_reason TEXT,
    passport_id TEXT UNIQUE, verification_url TEXT, submitted_at TEXT NOT NULL, reviewed_at TEXT,
    approval_at TEXT, access_token TEXT UNIQUE, updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_application_id ON applications(application_id);
  CREATE INDEX IF NOT EXISTS idx_email ON applications(email);
  CREATE INDEX IF NOT EXISTS idx_minecraft_username ON applications(minecraft_username);
  CREATE INDEX IF NOT EXISTS idx_passport_id ON applications(passport_id);
  CREATE INDEX IF NOT EXISTS idx_status ON applications(status);
  CREATE TABLE IF NOT EXISTS review_history (id INTEGER PRIMARY KEY AUTOINCREMENT, application_id TEXT NOT NULL, action TEXT NOT NULL, message TEXT, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, application_id TEXT, created_at TEXT NOT NULL);
`)

try { db.exec('ALTER TABLE applications ADD COLUMN access_token TEXT') } catch (error) { if (!String(error.message).includes('duplicate column')) throw error }
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_access_token ON applications(access_token)')

const now = () => new Date().toISOString()
const nextId = (prefix, count) => `${prefix}-${String(count).padStart(6, '0')}`
const publicApplication = row => ({ applicationId: row.application_id, minecraftUsername: row.minecraft_username, submissionDate: row.submitted_at, status: row.status, lastUpdated: row.updated_at, adminMessage: row.admin_message || row.rejection_reason || null })
const adminApplication = row => ({ ...publicApplication(row), playerName: row.player_name, minecraftUuid: row.minecraft_uuid, discordUsername: row.discord_username, discordId: row.discord_id, serverMode: row.server_mode, playerBio: row.player_bio, photoUrl: row.photo_path ? `/uploads/${path.basename(row.photo_path)}` : null, passportId: row.passport_id, history: db.prepare('SELECT action, message, created_at AS createdAt FROM review_history WHERE application_id = ? ORDER BY created_at DESC').all(row.application_id) })

const schema = z.object({ playerName: z.string().trim().min(2).max(80), minecraftUsername: z.string().trim().min(3).max(40), minecraftUuid: z.string().trim().max(60).optional(), discordUsername: z.string().trim().min(2).max(50), discordId: z.string().trim().min(2).max(30), serverMode: z.enum(['Survival', 'Anarchy']), playerBio: z.string().trim().min(12).max(600), })
const upload = multer({ storage: multer.diskStorage({ destination: uploadsDir, filename: (_, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`) }), limits: { fileSize: 4 * 1024 * 1024 }, fileFilter: (_, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) })

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false }))
app.use('/uploads', express.static(uploadsDir, { maxAge: '1h' }))
app.use(express.static(path.join(root, 'public')))
app.use(session({ secret: process.env.SESSION_SECRET || 'development-only-change-me', resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 }, store: new (SQLiteStoreFactory(session))({ db: 'sessions.sqlite', dir: runtimeDir }) }))
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false })
const requireAdmin = (req, res, next) => req.session.isAdmin ? next() : res.status(401).json({ error: 'Administrator authentication required.' })

const log = (action, applicationId) => db.prepare('INSERT INTO audit_logs (action, application_id, created_at) VALUES (?, ?, ?)').run(action, applicationId, now())

app.post('/api/applications', upload.single('photo'), async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Please complete every field with valid information.' })
  const data = parsed.data
  data.minecraftUuid = data.minecraftUuid || `YUG-CODE-${crypto.randomBytes(6).toString('hex').toUpperCase()}`
  const existing = db.prepare('SELECT application_id FROM applications WHERE minecraft_username = ? AND status IN (\'PENDING\', \'UNDER REVIEW\', \'NEEDS CHANGES\')').get(data.minecraftUsername)
  if (existing) return res.status(409).json({ error: 'An active application already exists for this Minecraft username.', applicationId: existing.application_id })
  const count = db.prepare('SELECT COUNT(*) AS count FROM applications').get().count + 1
  const applicationId = nextId('YUG-APP', count)
  const timestamp = now()
  db.prepare(`INSERT INTO applications (application_id, player_name, minecraft_username, minecraft_uuid, discord_username, discord_id, server_mode, player_bio, email, photo_path, status, submitted_at, updated_at) VALUES (@applicationId, @playerName, @minecraftUsername, @minecraftUuid, @discordUsername, @discordId, @serverMode, @playerBio, '', @photoPath, 'PENDING', @timestamp, @timestamp)`).run({ ...data, applicationId, photoPath: req.file?.path || null, timestamp })
  db.prepare('INSERT INTO review_history (application_id, action, created_at) VALUES (?, ?, ?)').run(applicationId, 'SUBMITTED', timestamp)
  log('Application submitted', applicationId)
  res.status(201).json({ applicationId, status: 'PENDING' })
})

app.post('/api/status', (req, res) => {
  const data = z.object({ applicationId: z.string().trim().min(1), discordId: z.string().trim().min(2).max(30) }).safeParse(req.body)
  if (!data.success) return res.status(400).json({ error: 'Enter your application ID and Discord ID.' })
  const row = db.prepare('SELECT * FROM applications WHERE application_id = ? AND discord_id = ?').get(data.data.applicationId, data.data.discordId)
  if (!row) return res.status(404).json({ error: 'No application matches that ID and Discord ID.' })
  res.json(publicApplication(row))
})

app.get('/api/minecraft/uuid/:username', async (req, res) => {
  const username = String(req.params.username || '').trim()
  if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) return res.status(400).json({ error: 'Enter a valid Minecraft username.' })
  try {
    const providers = [
      async () => { const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`); return response.ok ? response.json() : null },
      async () => { const response = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(username)}`); if (!response.ok) return null; const result = await response.json(); return result.data?.player || null },
    ]
    let profile = null
    for (const provider of providers) { try { profile = await provider(); if (profile) break } catch {} }
    if (!profile?.id) return res.status(404).json({ error: 'Minecraft username not found.' })
    const raw = profile.id.replaceAll('-', '')
    const uuid = raw.length === 32 ? `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}` : raw
    res.json({ uuid })
  } catch {
    res.status(502).json({ error: 'Minecraft profile lookup is temporarily unavailable.' })
  }
})

app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const password = String(req.body.password || '')
  const authorized = (process.env.ADMIN_EMAIL || '').toLowerCase()
  const valid = authorized && email === authorized && process.env.ADMIN_PASSWORD_HASH && await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
  if (!valid) return res.status(401).json({ error: 'Invalid administrator credentials.' })
  req.session.isAdmin = true
  req.session.adminEmail = email
  res.json({ ok: true })
})
app.post('/api/admin/logout', requireAdmin, (req, res) => req.session.destroy(() => res.json({ ok: true })))
app.get('/api/admin/me', (req, res) => res.json({ authenticated: Boolean(req.session.isAdmin) }))
app.get('/api/admin/applications', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT application_id AS applicationId, player_name AS playerName, minecraft_username AS minecraftUsername, discord_id AS discordId, submitted_at AS submissionDate, status FROM applications ORDER BY submitted_at DESC').all()
  res.json(rows)
})
app.get('/api/admin/applications/:id', requireAdmin, (req, res) => { const row = db.prepare('SELECT * FROM applications WHERE application_id = ?').get(req.params.id); row ? res.json(adminApplication(row)) : res.status(404).json({ error: 'Application not found.' }) })
app.post('/api/admin/applications/:id/review', requireAdmin, async (req, res) => {
  const action = z.object({ status: z.enum(['UNDER REVIEW', 'APPROVED', 'REJECTED', 'NEEDS CHANGES']), message: z.string().trim().max(1000).optional() }).safeParse(req.body)
  if (!action.success || (['REJECTED', 'NEEDS CHANGES'].includes(action.data.status) && !action.data.message)) return res.status(400).json({ error: 'A message is required for rejection or requested changes.' })
  const row = db.prepare('SELECT * FROM applications WHERE application_id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Application not found.' })
  const timestamp = now(); let passportId = row.passport_id; let accessToken = row.access_token
  if (action.data.status === 'APPROVED' && !passportId) passportId = nextId('YUG-PASS', db.prepare('SELECT COUNT(*) AS count FROM applications WHERE passport_id IS NOT NULL').get().count + 1)
  if (action.data.status === 'APPROVED' && !accessToken) accessToken = crypto.randomBytes(32).toString('hex')
  const verificationUrl = passportId ? `${appOrigin}/verify/${passportId}` : row.verification_url
  db.prepare('UPDATE applications SET status = ?, admin_message = ?, rejection_reason = ?, passport_id = ?, verification_url = ?, access_token = ?, reviewed_at = ?, approval_at = ?, updated_at = ? WHERE application_id = ?').run(action.data.status, action.data.status === 'REJECTED' || action.data.status === 'NEEDS CHANGES' ? action.data.message : null, action.data.status === 'REJECTED' ? action.data.message : null, passportId, verificationUrl, accessToken, timestamp, action.data.status === 'APPROVED' ? timestamp : row.approval_at, timestamp, req.params.id)
  db.prepare('INSERT INTO review_history (application_id, action, message, created_at) VALUES (?, ?, ?, ?)').run(req.params.id, action.data.status, action.data.message || null, timestamp)
  log(`Application ${action.data.status.toLowerCase()}`, req.params.id)
  res.json({ ok: true, passportId })
})
app.get('/api/verify/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM applications WHERE passport_id = ? AND status = \'APPROVED\'').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'PASSPORT NOT VALID' })
  res.json({ passportId: row.passport_id, playerName: row.player_name, minecraftUsername: row.minecraft_username, server: 'YUGAM SMP', mode: row.server_mode, issueDate: row.approval_at, status: 'VERIFIED' })
})
app.get('/api/passports/:id', async (req, res) => {
  const row = db.prepare('SELECT * FROM applications WHERE passport_id = ? AND access_token = ? AND status = \'APPROVED\'').get(req.params.id, req.query.token)
  if (!row) return res.status(404).json({ error: 'Private passport access requires the secure link from your approval email.' })
  const qrCode = await QRCode.toDataURL(row.verification_url)
  res.json({ passportId: row.passport_id, playerName: row.player_name, minecraftUsername: row.minecraft_username, minecraftUuid: row.minecraft_uuid, discordUsername: row.discord_username, server: 'YUGAM SMP', mode: row.server_mode, issueDate: row.approval_at, status: 'VERIFIED', photoUrl: row.photo_path ? `/uploads/${path.basename(row.photo_path)}` : null, verificationUrl: row.verification_url, qrCode })
})
app.use((_, res) => res.sendFile(path.join(root, 'public', 'index.html')))
if (!isVercel) app.listen(port, () => console.log(`YUGAM SMP registry running at ${appOrigin}`))

export default app
