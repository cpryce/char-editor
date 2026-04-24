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
const AUTH_DEBUG = process.env.AUTH_DEBUG === 'true';

// ── Middleware ──────────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

// session middleware is applied inside start() after DB connects

function authDebugLog(event: string, req: express.Request, extra: Record<string, unknown> = {}) {
  if (!AUTH_DEBUG) return;
  console.log('[auth-debug]', {
    event,
    method: req.method,
    path: req.path,
    sid: req.sessionID ?? null,
    hasCookieHeader: Boolean(req.headers.cookie),
    forwardedProto: req.headers['x-forwarded-proto'] ?? null,
    forwardedHost: req.headers['x-forwarded-host'] ?? null,
    host: req.headers.host ?? null,
    origin: req.headers.origin ?? null,
    referer: req.headers.referer ?? null,
    isAuthenticated: typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false,
    ...extra,
  });
}

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

// ── Routes ──────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get(
  '/auth/google',
  (req, _res, next) => {
    authDebugLog('oauth_start', req);
    next();
  },
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  }),
);

app.get(
  '/auth/google/callback',
  (req, _res, next) => {
    authDebugLog('oauth_callback_entry', req, {
      codePresent: typeof req.query.code === 'string',
      statePresent: typeof req.query.state === 'string',
    });
    next();
  },
  (req, res, next) => {
    passport.authenticate('google', (err: unknown, user: Express.User | false, info: unknown) => {
      if (err) {
        console.error('OAuth callback error:', err);
        authDebugLog('oauth_callback_error', req, { err: String(err) });
        return res.redirect(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/?error=auth_error`);
      }

      if (!user) {
        authDebugLog('oauth_callback_no_user', req, { info: JSON.stringify(info ?? null) });
        return res.redirect(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/?error=auth_failed`);
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('OAuth login session error:', loginErr);
          authDebugLog('oauth_callback_login_error', req, { err: String(loginErr) });
          return res.redirect(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/?error=login_failed`);
        }

        authDebugLog('oauth_callback_authenticated', req, {
          userId: (req.user as { _id?: mongoose.Types.ObjectId } | undefined)?._id?.toString() ?? null,
          sessionPassport: Boolean((req.session as { passport?: unknown })?.passport),
        });

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            authDebugLog('oauth_callback_session_save_error', req, { err: String(saveErr) });
            return res.redirect(`${process.env.CLIENT_URL ?? 'http://localhost:5173'}/?error=session_failed`);
          }

          authDebugLog('oauth_callback_session_saved', req);
          return res.redirect(process.env.CLIENT_URL ?? 'http://localhost:5173');
        });
      });
    })(req, res, next);
  },
);

app.get('/auth/me', (req, res) => {
  authDebugLog('auth_me', req, {
    sessionPassport: Boolean((req.session as { passport?: unknown })?.passport),
  });
  if (req.isAuthenticated()) {
    const u = req.user as { _id: mongoose.Types.ObjectId; name?: string; email: string; avatar?: string };
    res.json({ id: u._id, name: u.name, email: u.email, avatar: u.avatar });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.get('/api/auth/debug', (req, res) => {
  if (!AUTH_DEBUG) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  res.json({
    env: {
      nodeEnv: process.env.NODE_ENV ?? null,
      clientUrl: process.env.CLIENT_URL ?? null,
      callbackUri: process.env.CALLBACK_URI ?? null,
      trustProxy: app.get('trust proxy'),
      cookie: {
        name: SESSION_COOKIE_NAME,
        sameSite: COOKIE_SAME_SITE,
        secure: COOKIE_SAME_SITE === 'none' ? true : COOKIE_SECURE,
      },
    },
    request: {
      host: req.headers.host ?? null,
      forwardedHost: req.headers['x-forwarded-host'] ?? null,
      forwardedProto: req.headers['x-forwarded-proto'] ?? null,
      origin: req.headers.origin ?? null,
      referer: req.headers.referer ?? null,
      hasCookieHeader: Boolean(req.headers.cookie),
    },
    session: {
      sid: req.sessionID ?? null,
      hasSession: Boolean(req.session),
      sessionPassport: Boolean((req.session as { passport?: unknown })?.passport),
    },
    auth: {
      isAuthenticated: req.isAuthenticated(),
      userId: (req.user as { _id?: mongoose.Types.ObjectId } | undefined)?._id?.toString() ?? null,
    },
  });
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

// ── Encounter Sessions ──────────────────────────────────────────

const MAX_SESSIONS = 5;

app.get('/api/sessions', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const sessions = await EncounterSession.find({ userId: u._id }).sort({ lastAccessed: -1 }).lean();
  res.json(sessions.map((s) => ({ ...s, id: s._id.toString() })));
});

app.post('/api/sessions', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const count = await EncounterSession.countDocuments({ userId: u._id });
  if (count >= MAX_SESSIONS) {
    res.status(400).json({ error: `Maximum of ${MAX_SESSIONS} sessions reached.` });
    return;
  }
  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: 'Name is required.' }); return; }
  const session = await EncounterSession.create({ userId: u._id, name: name.trim() });
  res.status(201).json({ ...session.toObject(), id: session._id.toString() });
});

app.get('/api/sessions/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const session = await EncounterSession.findOne({ _id: req.params.id, userId: u._id }).lean();
  if (!session) { res.status(404).json({ error: 'Not found' }); return; }
  await EncounterSession.updateOne({ _id: session._id }, { lastAccessed: new Date() });
  res.json({ ...session, id: session._id.toString() });
});

app.put('/api/sessions/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const { name, players } = req.body as { name?: string; players?: unknown };
  const update: Record<string, unknown> = { lastAccessed: new Date() };
  if (name !== undefined) update.name = name.trim();
  if (players !== undefined) update.players = players;
  const encSession = await EncounterSession.findOneAndUpdate(
    { _id: req.params.id, userId: u._id },
    update,
    { returnDocument: 'after', runValidators: true }
  ).lean();
  if (!encSession) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ...encSession, id: encSession._id.toString() });
});

app.delete('/api/sessions/:id', async (req, res) => {
  if (!req.isAuthenticated()) { res.status(401).json({ error: 'Not authenticated' }); return; }
  const u = req.user as { _id: mongoose.Types.ObjectId };
  const encSession = await EncounterSession.findOneAndDelete({ _id: req.params.id, userId: u._id });
  if (!encSession) { res.status(404).json({ error: 'Not found' }); return; }
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
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
  }

  // Session middleware applied here so MongoStore is ready before any requests
  const store = MONGO_URI
    ? MongoStore.create({ mongoUrl: MONGO_URI, collectionName: 'sessions', ttl: 14 * 24 * 60 * 60 })
    : undefined;

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

  app.use(passport.initialize());
  app.use(passport.session());

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
