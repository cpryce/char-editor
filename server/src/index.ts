// Webhook test - if this deploys automatically, the GitHub integration is working
import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import mongoose from 'mongoose';
import path from 'path';
import { User } from './models/User';
import { fillCharacterPdf } from './utils/fillCharacterPdf';
import { Character } from './models/Character';
import { CustomFeat } from './models/CustomFeat';
import { CustomClass } from './models/CustomClass';
import { EncounterSession } from './models/EncounterSession';
import { Campaign } from './models/Campaign';
import { SpellProgression } from './models/SpellProgression';
import { SRD_SPELL_PROGRESSIONS } from './data/spellProgressionSeed';

const app = express();
const PORT = process.env.PORT ?? 3001;
const MONGO_URI = process.env.MONGO_URI ?? '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SESSION_COOKIE_NAME = 'connect.sid';
const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE ?? (IS_PRODUCTION ? 'none' : 'lax')) as 'lax' | 'strict' | 'none';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'false' ? false : IS_PRODUCTION;
const mongooseReady = MONGO_URI ? mongoose.connect(MONGO_URI) : Promise.resolve(null);

// ── Middleware ──────────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Reuse the same Mongo connection for both mongoose models and session store.
// This avoids a second independent connect attempt that can emit ECONNREFUSED
// while the main mongoose connection is still negotiating.
const store = MONGO_URI
  ? MongoStore.create({
    clientPromise: mongooseReady.then(() => mongoose.connection.getClient()),
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60,
  })
  : undefined;

if (store) {
  store.on('error', (err) => {
    console.error('Session store error:', err.message);
  });
}

app.use(session({
  name: SESSION_COOKIE_NAME,
  secret: process.env.SESSION_SECRET ?? 'fallback_secret',
  resave: false,
  saveUninitialized: true,
  store,
  cookie: {
    httpOnly: true,
    sameSite: COOKIE_SAME_SITE,
    secure: COOKIE_SAME_SITE === 'none' ? true : COOKIE_SECURE,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// ── Passport ────────────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackURL: process.env.CALLBACK_URI ?? 'http://localhost:3001/auth/google/callback',
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        const avatar = profile.photos?.[0]?.value;
        user = await User.create({
          googleId: profile.id,
          email: profile.emails?.[0]?.value ?? '',
          name: profile.displayName,
          ...(avatar ? { avatar } : {}),
        });
      }
      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  },
));

passport.serializeUser((user, done) => {
  const u = user as { _id: mongoose.Types.ObjectId };
  done(null, u._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err as Error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// ── Routes ──────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get(
  '/auth/google',
  (req, res, next) => {
    const returnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : null;
    if (returnTo && /^\/invite\/[a-f0-9]+$/.test(returnTo)) {
      (req.session as { returnTo?: string }).returnTo = returnTo;
      // Explicitly save before handing off to Passport so the redirect doesn't
      // race the session store write (auto-save fires at response-end, which
      // may be too late when Passport sends the Google redirect immediately).
      req.session.save((err) => {
        if (err) { next(err); return; }
        next();
      });
    } else {
      next();
    }
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  }),
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/?error=auth_failed`,
    // Passport ≥ 0.6 regenerates the session after login (session-fixation protection),
    // which destroys the returnTo value saved before the OAuth redirect. keepSessionInfo
    // preserves the pre-auth session data so returnTo survives the round-trip.
    keepSessionInfo: true,
  }),
  (req, res) => {
    req.session.save((err) => {
      if (err) return res.redirect(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/?error=session_failed`);
      const returnTo = (req.session as { returnTo?: string }).returnTo;
      delete (req.session as { returnTo?: string }).returnTo;
      const base = process.env.CLIENT_URL ?? 'http://localhost:5173';
      res.redirect(returnTo ? `${base}${returnTo}` : base);
    });
  },
);

app.get('/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    const u = req.user as { _id: mongoose.Types.ObjectId; name?: string; email: string; avatar?: string };
    res.json({ id: u._id, name: u.name, email: u.email, avatar: u.avatar });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.post('/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((sessionErr) => {
      if (sessionErr) return next(sessionErr);
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      res.json({ ok: true });
    });
  });
});

// ── Character routes ────────────────────────────────────────────
app.get('/api/characters', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const characters = await Character.find(
    { $or: [{ owner: u._id }, { delegatedTo: u._id }] },
    { name: 1, race: 1, classes: 1, updatedAt: 1, 'abilityScores.dexterity': 1, 'combat.initiative.miscBonus': 1, owner: 1, delegatedTo: 1, pendingInviteEmail: 1 },
  ).sort({ updatedAt: -1 });
  const userId = u._id.toString();
  res.json(characters.map(c => ({
    ...c.toObject(),
    isDelegated: c.delegatedTo?.toString() === userId,
  })));
});

app.post('/api/characters', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  try {
    const owner = await User.findById(u._id);
    const character = await Character.create({ ...req.body, owner: u._id, player: owner?.name ?? '' });
    res.status(201).json(character);
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.message });
    } else {
      throw err;
    }
  }
});

app.get('/api/characters/:id/export-pdf', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const character = await Character.findOne({ _id: req.params.id, $or: [{ owner: u._id }, { delegatedTo: u._id }] });
  if (!character) { res.status(404).json({ error: 'Not found' }); return; }
  try {
    const classNames = (character.classes as Array<{ name: string }> | undefined)?.map((c) => c.name) ?? [];
    const customClasses = classNames.length > 0
      ? await CustomClass.find({ name: { $in: classNames } }).lean()
      : [];
    const customClassFeatures = customClasses.map((cc) => ({ className: cc.name, features: cc.features }));
    const pdfBytes = await fillCharacterPdf(character, customClassFeatures);
    const safeName = (character.name ?? 'character').replace(/[^a-z0-9_\- ]/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_character_sheet.pdf"`);
    res.end(Buffer.from(pdfBytes));
  } catch (err: unknown) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.get('/api/characters/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const character = await Character.findOne({ _id: req.params.id, $or: [{ owner: u._id }, { delegatedTo: u._id }] });
  if (!character) { res.status(404).json({ error: 'Not found' }); return; }
  // Include custom class definitions for any non-standard classes used by the character.
  // This ensures the delegate (or anyone viewing the character) can compute correct BAB/saves
  // even if those custom classes belong to a different user.
  const classNames = ((character.classes ?? []) as Array<{ name: string }>).map((c) => c.name).filter(Boolean);
  const ownerId = character.owner instanceof mongoose.Types.ObjectId ? character.owner : new mongoose.Types.ObjectId(String(character.owner));
  const characterCustomClasses = classNames.length > 0
    ? await CustomClass.find({ name: { $in: classNames }, owner: ownerId })
    : [];
  const userId = u._id.toString();
  res.json({ ...character.toObject(), isDelegated: character.delegatedTo?.toString() === userId, characterCustomClasses });
});

app.put('/api/characters/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  // Owner is read-only while a delegate is active; only the delegate may edit
  const existing = await Character.findOne({ _id: req.params.id, $or: [{ owner: u._id }, { delegatedTo: u._id }] });
  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  const isOwner = existing.owner?.toString() === u._id.toString();
  const OWNER_LOCK_TTL_MS = 3 * 60 * 1000; // 3 minutes
  const lockExpiry = new Date(Date.now() - OWNER_LOCK_TTL_MS);

  const updateBody = isOwner && existing.delegatedTo
    ? { ...req.body, ownerEditingAt: new Date() }
    : req.body;

  // For delegate saves, embed the lock check in the query filter so the
  // check-and-write is atomic (no TOCTOU window).
  const lockFilter = isOwner
    ? {}
    : { $or: [{ ownerEditingAt: null }, { ownerEditingAt: { $lt: lockExpiry } }] };

  try {
    const character = await Character.findOneAndUpdate(
      { _id: req.params.id, $or: [{ owner: u._id }, { delegatedTo: u._id }], ...lockFilter },
      { $set: updateBody },
      { returnDocument: 'after', runValidators: true },
    );
    if (!character) {
      // Distinguish "locked out" from "not found" for the delegate path
      if (!isOwner) {
        const stillExists = await Character.exists({ _id: req.params.id, delegatedTo: u._id });
        if (stillExists) {
          res.status(423).json({ error: 'The owner is currently editing this character.' });
          return;
        }
      }
      res.status(404).json({ error: 'Not found' }); return;
    }
    res.json(character);
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.message });
    } else {
      throw err;
    }
  }
});

// ── Delegation / Invite routes ────────────────────────────────────────────────

app.get('/api/characters/:id/invite', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const character = await Character.findOne({ _id: req.params.id, owner: u._id });
  if (!character) { res.status(404).json({ error: 'Not found' }); return; }
  if (!character.pendingInviteToken) { res.status(404).json({ error: 'No pending invite' }); return; }
  res.json({ token: character.pendingInviteToken });
});

app.post('/api/characters/:id/invite', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const { email } = req.body as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' }); return;
  }
  const character = await Character.findOne({ _id: req.params.id, owner: u._id });
  if (!character) { res.status(404).json({ error: 'Not found' }); return; }
  const token = crypto.randomBytes(32).toString('hex');
  character.pendingInviteToken = token;
  character.pendingInviteEmail = email;
  await character.save();
  res.json({ token });
});

app.delete('/api/characters/:id/invite', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const character = await Character.findOne({ _id: req.params.id, owner: u._id });
  if (!character) { res.status(404).json({ error: 'Not found' }); return; }
  character.pendingInviteToken = null;
  character.pendingInviteEmail = null;
  await character.save();
  res.status(204).end();
});

app.delete('/api/characters/:id/delegate', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  // Allow either the owner or the current delegate to end delegation
  const character = await Character.findOne({
    _id: req.params.id,
    $or: [{ owner: u._id }, { delegatedTo: u._id }],
  });
  if (!character) { res.status(404).json({ error: 'Not found' }); return; }
  character.delegatedTo = null;
  await character.save();
  res.status(204).end();
});

// ── Owner edit-lock routes ────────────────────────────────────────────────────

// POST: owner claims (or refreshes) the edit lock
app.post('/api/characters/:id/owner-lock', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const character = await Character.findOneAndUpdate(
    { _id: req.params.id, owner: u._id },
    { $set: { ownerEditingAt: new Date() } },
  );
  if (!character) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).end();
});

// DELETE: owner releases the edit lock
app.delete('/api/characters/:id/owner-lock', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  await Character.findOneAndUpdate(
    { _id: req.params.id, owner: u._id },
    { $set: { ownerEditingAt: null } },
  );
  res.status(204).end();
});

app.get('/api/invite/:token', async (req, res) => {
  const character = await Character.findOne({ pendingInviteToken: req.params.token }).populate<{ owner: { name?: string } }>('owner', 'name');
  if (!character) { res.status(404).json({ error: 'Invite not found or already accepted' }); return; }
  const owner = character.owner as unknown as { name?: string };
  res.json({ characterId: character._id, characterName: character.name, ownerName: owner?.name ?? 'Unknown' });
});

app.post('/api/invite/:token/accept', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const character = await Character.findOne({ pendingInviteToken: req.params.token });
  if (!character) { res.status(404).json({ error: 'Invite not found or already accepted' }); return; }
  if (character.delegatedTo) { res.status(409).json({ error: 'Character already has an active delegate' }); return; }
  if (character.owner?.toString() === u._id.toString()) {
    res.status(400).json({ error: 'You cannot accept an invite to your own character' }); return;
  }
  character.delegatedTo = u._id;
  character.pendingInviteToken = null;
  character.pendingInviteEmail = null;
  await character.save();
  res.json({ characterId: character._id });
});

app.delete('/api/characters/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const character = await Character.findOneAndDelete({ _id: req.params.id, owner: u._id });
  if (!character) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).end();
});

// ── Custom Feat routes ──────────────────────────────────────────

app.get('/api/custom-feats', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const feats = await CustomFeat.find({}).sort({ name: 1 }).lean();
  res.json(feats.map((f) => ({ ...f, isOwner: f.owner?.toString() === u._id.toString() })));
});

app.post('/api/custom-feats', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  try {
    const feat = await CustomFeat.create({ ...req.body, owner: u._id });
    res.status(201).json(feat);
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.message });
    } else if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ error: 'A custom feat with this name already exists.' });
    } else {
      throw err;
    }
  }
});

app.get('/api/custom-feats/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const feat = await CustomFeat.findById(req.params.id).lean();
  if (!feat) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ...feat, isOwner: feat.owner?.toString() === u._id.toString() });
});

app.put('/api/custom-feats/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  try {
    const feat = await CustomFeat.findOneAndUpdate(
      { _id: req.params.id, owner: u._id },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true },
    );
    if (!feat) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(feat);
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.message });
    } else if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ error: 'A custom feat with this name already exists.' });
    } else {
      throw err;
    }
  }
});

app.delete('/api/custom-feats/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const feat = await CustomFeat.findOneAndDelete({ _id: req.params.id, owner: u._id });
  if (!feat) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).end();
});

// ── Custom Classes ───────────────────────────────────────────────────────────

app.get('/api/custom-classes', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const classes = await CustomClass.find({}).sort({ name: 1 }).lean();
  res.json(classes.map((c) => ({ ...c, isOwner: c.owner?.toString() === u._id.toString() })));
});

app.post('/api/custom-classes', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  try {
    const cls = await CustomClass.create({ ...req.body, owner: u._id });
    res.status(201).json(cls);
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.message });
    } else if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ error: 'A custom class with this name already exists.' });
    } else {
      throw err;
    }
  }
});

app.get('/api/custom-classes/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const cls = await CustomClass.findById(req.params.id).lean();
  if (!cls) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ...cls, isOwner: cls.owner?.toString() === u._id.toString() });
});

app.put('/api/custom-classes/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  try {
    const cls = await CustomClass.findOneAndUpdate(
      { _id: req.params.id, owner: u._id },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true },
    );
    if (!cls) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(cls);
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.message });
    } else if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ error: 'A custom class with this name already exists.' });
    } else {
      throw err;
    }
  }
});

app.delete('/api/custom-classes/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const cls = await CustomClass.findOneAndDelete({ _id: req.params.id, owner: u._id });
  if (!cls) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).end();
});

// ── Spell Progressions ─────────────────────────────────

async function ensureDefaultSpellProgressions(userId: mongoose.Types.ObjectId) {
  for (const p of SRD_SPELL_PROGRESSIONS) {
    await SpellProgression.findOneAndUpdate(
      { owner: userId, className: p.className },
      {
        $set: {
          casterAbility: p.casterAbility,
          isDefault: true,
          levels: p.levels,
          ...(p.maxSpellLevel !== undefined ? { maxSpellLevel: p.maxSpellLevel } : {}),
          ...(p.hasLimitedSpellsKnown !== undefined ? { hasLimitedSpellsKnown: p.hasLimitedSpellsKnown } : {}),
          ...(p.spellsKnown !== undefined ? { spellsKnown: p.spellsKnown } : {}),
        },
        $setOnInsert: { owner: userId, className: p.className },
      },
      { upsert: true },
    );
  }
}

app.get('/api/spell-progressions', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  await ensureDefaultSpellProgressions(u._id);
  const progressions = await SpellProgression.find({ owner: u._id }).sort({ className: 1 }).lean();
  res.json(progressions);
});

app.post('/api/spell-progressions', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  try {
    const prog = await SpellProgression.create({ ...req.body, owner: u._id, isDefault: false });
    res.status(201).json(prog);
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.message });
    } else if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ error: 'A spell progression for this class already exists.' });
    } else {
      throw err;
    }
  }
});

app.get('/api/spell-progressions/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const prog = await SpellProgression.findOne({ _id: req.params.id, owner: u._id }).lean();
  if (!prog) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(prog);
});

app.put('/api/spell-progressions/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  try {
    const { isDefault: _ignored, owner: _owner, ...body } = req.body;
    const prog = await SpellProgression.findOneAndUpdate(
      { _id: req.params.id, owner: u._id },
      { $set: body },
      { returnDocument: 'after', runValidators: true },
    );
    if (!prog) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(prog);
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.message });
    } else if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ error: 'A spell progression for this class already exists.' });
    } else {
      throw err;
    }
  }
});

app.delete('/api/spell-progressions/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  // Disallow deleting SRD defaults
  const prog = await SpellProgression.findOne({ _id: req.params.id, owner: u._id });
  if (!prog) { res.status(404).json({ error: 'Not found' }); return; }
  if (prog.isDefault) { res.status(403).json({ error: 'Cannot delete an SRD default progression.' }); return; }
  await prog.deleteOne();
  res.status(204).end();
});

// ── Encounters ──────────────────────────────────────────

const MAX_ENCOUNTERS = 5;

app.get('/api/encounters', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const encounters = await EncounterSession.find({ userId: u._id }).sort({ lastAccessed: -1 }).lean();
  const campaignIds = [...new Set(encounters.map((e) => e.campaignId?.toString()).filter((id): id is string => Boolean(id)))];
  const campaigns = campaignIds.length > 0
    ? await Campaign.find({ _id: { $in: campaignIds } }, { name: 1 }).lean()
    : [];
  const campaignMap = new Map(campaigns.map((c) => [c._id.toString(), c.name]));
  res.json(encounters.map((s) => ({
    ...s,
    id: s._id.toString(),
    campaignName: s.campaignId ? (campaignMap.get(s.campaignId.toString()) ?? null) : null,
  })));
});

app.post('/api/encounters', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const count = await EncounterSession.countDocuments({ userId: u._id });
  if (count >= MAX_ENCOUNTERS) {
    res.status(400).json({ error: `Maximum of ${MAX_ENCOUNTERS} encounters reached.` });
    return;
  }
  const { name, campaignId } = req.body as { name?: string; campaignId?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Name is required.' }); return; }
  const encounter = await EncounterSession.create({
    userId: u._id,
    name: name.trim(),
    campaignId: campaignId || null,
  });
  if (campaignId) {
    await Campaign.updateOne({ _id: campaignId, owner: u._id }, { $addToSet: { encounterIds: encounter._id } });
  }
  let campaignName: string | null = null;
  if (campaignId) {
    const campaign = await Campaign.findById(campaignId, { name: 1 }).lean();
    campaignName = campaign?.name ?? null;
  }
  res.status(201).json({ ...encounter.toObject(), id: encounter._id.toString(), campaignName });
});

app.get('/api/encounters/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const encounter = await EncounterSession.findOne({ _id: req.params.id, userId: u._id }).lean();
  if (!encounter) { res.status(404).json({ error: 'Not found' }); return; }
  await EncounterSession.updateOne({ _id: encounter._id }, { lastAccessed: new Date() });
  let campaignName: string | null = null;
  if (encounter.campaignId) {
    const campaign = await Campaign.findById(encounter.campaignId, { name: 1 }).lean();
    campaignName = campaign?.name ?? null;
  }
  res.json({ ...encounter, id: encounter._id.toString(), campaignName });
});

app.put('/api/encounters/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const { name, players, description } = req.body as { name?: string; players?: unknown; description?: string };
  const update: Record<string, unknown> = { lastAccessed: new Date() };
  if (name !== undefined) update.name = name.trim();
  if (players !== undefined) update.players = players;
  if (description !== undefined) update.description = description;
  const encounter = await EncounterSession.findOneAndUpdate(
    { _id: req.params.id, userId: u._id },
    update,
    { returnDocument: 'after', runValidators: true }
  ).lean();
  if (!encounter) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ...encounter, id: encounter._id.toString() });
});

app.delete('/api/encounters/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const encounter = await EncounterSession.findOneAndDelete({ _id: req.params.id, userId: u._id });
  if (!encounter) { res.status(404).json({ error: 'Not found' }); return; }
  if (encounter.campaignId) {
    await Campaign.updateOne({ _id: encounter.campaignId }, { $pull: { encounterIds: encounter._id } });
  }
  res.status(204).end();
});

// ── Campaign routes ─────────────────────────────────────────────

/** Returns a campaign with populated character + encounter summaries. */
async function getCampaignDetail(campaignId: string, ownerId: mongoose.Types.ObjectId) {
  const campaign = await Campaign.findOne({ _id: campaignId, owner: ownerId }).lean();
  if (!campaign) return null;
  const [characters, encounters, ownerUser] = await Promise.all([
    Character.find(
      { _id: { $in: campaign.characterIds } },
      { name: 1, race: 1, classes: 1, owner: 1, delegatedTo: 1, pendingInviteEmail: 1, 'abilityScores.dexterity': 1, 'combat.initiative': 1 },
    ).lean(),
    EncounterSession.find(
      { _id: { $in: campaign.encounterIds } },
      { name: 1 },
    ).lean(),
    User.findById(ownerId, { name: 1, email: 1, avatar: 1 }).lean(),
  ]);
  const playerIds = [...new Set(
    characters.map((c) => {
      const raw = c as unknown as { delegatedTo?: { toString(): string } };
      return (raw.delegatedTo?.toString() ?? c.owner?.toString());
    }).filter((id): id is string => Boolean(id)),
  )];
  const playerUsers = playerIds.length > 0
    ? await User.find({ _id: { $in: playerIds } }, { name: 1, email: 1, avatar: 1 }).lean()
    : [];
  return {
    ...campaign,
    owner: ownerUser
      ? { _id: ownerUser._id.toString(), name: ownerUser.name, email: ownerUser.email, avatar: ownerUser.avatar }
      : null,
    characters: characters.map((c) => {
      const raw = c as unknown as {
        delegatedTo?: { toString(): string };
        pendingInviteEmail?: string;
        abilityScores?: { dexterity?: { base?: number; racial?: number; enhancement?: number; misc?: number; tempMod?: number; levelUp?: number; temp?: number } };
        combat?: { initiative?: { miscBonus?: number } };
      };
      const dex = raw.abilityScores?.dexterity;
      const dexTotal = dex
        ? (dex.temp ?? ((dex.base ?? 10) + (dex.racial ?? 0) + (dex.enhancement ?? 0) + (dex.misc ?? 0) + (dex.tempMod ?? 0) + (dex.levelUp ?? 0)))
        : 10;
      const initiativeModifier = Math.floor((dexTotal - 10) / 2) + Number(raw.combat?.initiative?.miscBonus ?? 0);
      return {
        _id: c._id.toString(),
        name: c.name,
        race: c.race,
        classes: c.classes,
        owner: c.owner?.toString() ?? null,
        delegatedTo: raw.delegatedTo?.toString() ?? null,
        pendingInviteEmail: raw.pendingInviteEmail ?? null,
        initiativeModifier,
      };
    }),
    encounters: encounters.map((e) => ({ _id: e._id.toString(), id: e._id.toString(), name: e.name })),
    players: playerUsers.map((u) => ({ _id: u._id.toString(), name: u.name, email: u.email, avatar: u.avatar })),
  };
}

app.get('/api/campaigns', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const campaigns = await Campaign.find({ owner: u._id }, { name: 1, description: 1, characterIds: 1, encounterIds: 1, updatedAt: 1 }).sort({ updatedAt: -1 }).lean();
  const allCharIds = campaigns.flatMap((c) => c.characterIds);
  const charOwners = allCharIds.length > 0
    ? await Character.find({ _id: { $in: allCharIds } }, { owner: 1 }).lean()
    : [];
  const charOwnerMap = new Map(charOwners.map((c) => [c._id.toString(), c.owner?.toString() ?? null]));
  res.json(campaigns.map((c) => ({
    ...c,
    playerCount: new Set(
      c.characterIds.map((id) => charOwnerMap.get(id.toString())).filter(Boolean),
    ).size,
  })));
});

app.post('/api/campaigns', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Name is required.' }); return; }
  const campaign = await Campaign.create({ owner: u._id, name: name.trim() });
  res.status(201).json(campaign);
});

app.get('/api/campaigns/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const detail = await getCampaignDetail(req.params.id, u._id);
  if (!detail) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(detail);
});

app.put('/api/campaigns/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const { name, description, pointBuySystem } = req.body as { name?: string; description?: string; pointBuySystem?: string | null };
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name.trim();
  if (description !== undefined) update.description = description;
  if (pointBuySystem !== undefined) update.pointBuySystem = pointBuySystem;
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, owner: u._id },
    { $set: update },
    { returnDocument: 'after', runValidators: true },
  ).lean();
  if (!campaign) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(campaign);
});

app.delete('/api/campaigns/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, owner: u._id });
  if (!campaign) { res.status(404).json({ error: 'Not found' }); return; }
  res.status(204).end();
});

app.post('/api/campaigns/:id/characters', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const { characterId } = req.body as { characterId?: string };
  if (!characterId) { res.status(400).json({ error: 'characterId is required.' }); return; }
  const char = await Character.findOne({ _id: characterId, $or: [{ owner: u._id }, { delegatedTo: u._id }] });
  if (!char) { res.status(404).json({ error: 'Character not found.' }); return; }
  await Campaign.updateOne(
    { _id: req.params.id, owner: u._id },
    { $addToSet: { characterIds: char._id } },
  );
  const detail = await getCampaignDetail(req.params.id, u._id);
  if (!detail) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(detail);
});

app.delete('/api/campaigns/:id/characters/:charId', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  await Campaign.updateOne(
    { _id: req.params.id, owner: u._id },
    { $pull: { characterIds: new mongoose.Types.ObjectId(req.params.charId) } },
  );
  const detail = await getCampaignDetail(req.params.id, u._id);
  if (!detail) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(detail);
});

app.post('/api/campaigns/:id/encounters', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const { encounterId } = req.body as { encounterId?: string };
  if (!encounterId) { res.status(400).json({ error: 'encounterId is required.' }); return; }
  const enc = await EncounterSession.findOne({ _id: encounterId, userId: u._id });
  if (!enc) { res.status(404).json({ error: 'Encounter not found.' }); return; }
  await Campaign.updateOne(
    { _id: req.params.id, owner: u._id },
    { $addToSet: { encounterIds: enc._id } },
  );
  const detail = await getCampaignDetail(req.params.id, u._id);
  if (!detail) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(detail);
});

app.delete('/api/campaigns/:id/encounters/:encId', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  await Campaign.updateOne(
    { _id: req.params.id, owner: u._id },
    { $pull: { encounterIds: new mongoose.Types.ObjectId(req.params.encId) } },
  );
  const detail = await getCampaignDetail(req.params.id, u._id);
  if (!detail) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(detail);
});

if (IS_PRODUCTION) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get(/^\/(?!api|auth).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── Database & boot ─────────────────────────────────────────────
async function start() {
  if (!MONGO_URI) {
    console.warn('MONGO_URI not set – skipping database connection');
  } else {
    await mongooseReady;
    console.log('Connected to MongoDB');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
