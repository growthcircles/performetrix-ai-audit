const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// ---- Data store (JSON file database) ----
const store = require('./data/store');
store.ensureStore();

// ---- App setup ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// ---- Auth middleware ----
function requireAuth(req, res, next) {
  const userId = parseInt(req.cookies.userId, 10);
  if (!userId || !store.findUserById(userId)) return res.redirect('/login');
  req.userId = userId;
  next();
}
function requireAdmin(req, res, next) {
  const userId = parseInt(req.cookies.userId, 10);
  if (!userId) return res.redirect('/login');
  const user = store.findUserById(userId);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  req.userId = userId;
  next();
}

// ---- Routes ----
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/survey'));
app.use('/', require('./routes/report'));
app.use('/', require('./routes/admin'));

// Root: redirect to login
app.get('/', (req, res) => {
  const userId = parseInt(req.cookies.userId, 10);
  if (userId && store.findUserById(userId)) return res.redirect('/survey');
  res.redirect('/login');
});

// Export for Vercel serverless
module.exports = app;