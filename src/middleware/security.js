const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Rate limiter général pour toutes les routes
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite à 100 requêtes par IP
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter strict pour les routes sensibles (login, etc.)
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite à 5 requêtes
  skipSuccessfulRequests: true, // Ne compte que les échecs
  message: {
    error: 'Trop de tentatives, veuillez réessayer plus tard',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Rate limiter pour les routes de création (POST)
 */
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 20, // 20 créations par heure
  message: {
    error: 'Trop de créations, veuillez réessayer plus tard',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Configuration Helmet pour les headers de sécurité
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Middleware de validation des IDs dans les paramètres
 */
function validateResourceId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];

    // Vérifier que c'est bien un entier positif
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: 'ID invalide',
        code: 'INVALID_ID'
      });
    }

    next();
  };
}

/**
 * Middleware de logging sécurisé
 * Ne log PAS les tokens, mots de passe, etc.
 */
function secureLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;

  // Ne pas logger les tokens ou données sensibles
  console.log(`[${timestamp}] ${method} ${path} - IP: ${ip}`);

  next();
}

/**
 * Middleware de sanitization des erreurs
 * Empêche la fuite d'informations sensibles dans les messages d'erreur
 */
function sanitizeErrors(err, req, res, next) {
  console.error('Error:', err);

  // En production, ne jamais exposer les détails des erreurs
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const response = {
    error: isDevelopment ? err.message : 'Une erreur est survenue',
    code: err.code || 'INTERNAL_ERROR'
  };

  // Ne pas exposer la stack trace en production
  if (isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(response);
}

/**
 * Configuration CORS sécurisée
 */
function getCorsOptions() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3002'];

  return {
    origin: function (origin, callback) {
      // Autoriser les requêtes sans origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'La politique CORS ne permet pas l\'accès depuis cette origine.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200
  };
}

module.exports = {
  generalLimiter,
  strictLimiter,
  createLimiter,
  helmetConfig,
  validateResourceId,
  secureLogger,
  sanitizeErrors,
  getCorsOptions
};
