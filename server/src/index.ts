// Webhook test - if this deploys automatically, the GitHub integration is working
import 'dotenv/config';
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
import { EncounterSession } from './models/EncounterSession';

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
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  }),
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/?error=auth_failed`,
  }),
  (req, res) => {
    req.session.save((err) => {
      if (err) return res.redirect(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/?error=session_failed`);
      res.redirect(process.env.CLIENT_URL ?? 'http://localhost:5173');
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
    { owner: u._id },
    { name: 1, classes: 1, updatedAt: 1, 'abilityScores.dexterity': 1, 'combat.initiative.miscBonus': 1 },
  ).sort({ updatedAt: -1 });
  res.json(characters);
});

app.post('/api/characters', async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  try {
    const character = await Character.create({ ...req.body, owner: u._id });
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
  const character = await Character.findOne({ _id: req.params.id, owner: u._id });
  if (!character) { res.status(404).json({ error: 'Not found' }); return; }
  try {
    const pdfBytes = await fillCharacterPdf(character);
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
  const character = await Character.findOne({ _id: req.params.id, owner: u._id });
  if (!character) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(character);
});

app.put('/api/characters/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  try {
    const character = await Character.findOneAndUpdate(
      { _id: req.params.id, owner: u._id },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true },
    );
    if (!character) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(character);
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.message });
    } else {
      throw err;
    }
  }
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
  const feats = await CustomFeat.find({ owner: u._id }).sort({ name: 1 });
  res.json(feats);
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
  const feat = await CustomFeat.findOne({ _id: req.params.id, owner: u._id });
  if (!feat) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(feat);
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

// ── Encounters ──────────────────────────────────────────

const MAX_ENCOUNTERS = 5;

app.get('/api/encounters', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const encounters = await EncounterSession.find({ userId: u._id }).sort({ lastAccessed: -1 }).lean();
  res.json(encounters.map((s) => ({ ...s, id: s._id.toString() })));
});

app.post('/api/encounters', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const count = await EncounterSession.countDocuments({ userId: u._id });
  if (count >= MAX_ENCOUNTERS) {
    res.status(400).json({ error: `Maximum of ${MAX_ENCOUNTERS} encounters reached.` });
    return;
  }
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Name is required.' }); return; }
  const encounter = await EncounterSession.create({ userId: u._id, name: name.trim() });
  res.status(201).json({ ...encounter.toObject(), id: encounter._id.toString() });
});

app.get('/api/encounters/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const encounter = await EncounterSession.findOne({ _id: req.params.id, userId: u._id }).lean();
  if (!encounter) { res.status(404).json({ error: 'Not found' }); return; }
  await EncounterSession.updateOne({ _id: encounter._id }, { lastAccessed: new Date() });
  res.json({ ...encounter, id: encounter._id.toString() });
});

app.put('/api/encounters/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const { name, players } = req.body as { name?: string; players?: unknown };
  const update: Record<string, unknown> = { lastAccessed: new Date() };
  if (name !== undefined) update.name = name.trim();
  if (players !== undefined) update.players = players;
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
  res.status(204).end();
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
