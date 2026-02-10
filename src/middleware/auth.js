const jwt = require('jsonwebtoken');

// Secret JWT - DOIT être dans .env en production
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Génère un token JWT pour un utilisateur
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Vérifie un token JWT
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware d'authentification JWT
 * Vérifie que l'utilisateur est authentifié
 */
function authenticateToken(req, res, next) {
  // Récupérer le token depuis le header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      error: 'Authentification requise',
      code: 'NO_TOKEN'
    });
  }

  const user = verifyToken(token);

  if (!user) {
    return res.status(403).json({
      error: 'Token invalide ou expiré',
      code: 'INVALID_TOKEN'
    });
  }

  // Ajouter l'utilisateur à la requête
  req.user = user;
  next();
}

/**
 * Middleware d'authentification optionnelle
 * N'échoue pas si pas de token, mais ajoute l'utilisateur si token valide
 */
function authenticateTokenOptional(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

/**
 * Middleware de vérification du rôle
 * Vérifie que l'utilisateur a un rôle spécifique
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentification requise',
        code: 'NO_AUTH'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès refusé - permissions insuffisantes',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
}

/**
 * Middleware de vérification de propriété de ressource
 * Vérifie que l'utilisateur a accès à la ressource (via collectiviteId)
 */
async function checkResourceOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentification requise',
      code: 'NO_AUTH'
    });
  }

  // Les admins ont accès à tout
  if (req.user.role === 'admin') {
    return next();
  }

  // TODO: Implémenter la logique de vérification de propriété
  // Par exemple, vérifier que req.user.collectiviteId === resource.collectiviteId

  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  authenticateTokenOptional,
  requireRole,
  checkResourceOwnership,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
