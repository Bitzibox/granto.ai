const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();

// Dossier de stockage
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/logos');

// S'assurer que le dossier existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuration multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomUUID() + ext;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format non supporté. Utilisez PNG, JPG, SVG ou WebP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo max
});

// POST /api/upload/logo - Upload un logo
router.post('/logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier envoyé' });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;

    res.json({
      success: true,
      logoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    console.error('Erreur upload logo:', err);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// DELETE /api/upload/logo/:filename - Supprimer un logo
router.delete('/logo/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename); // Sécurité: empêcher path traversal
    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    console.error('Erreur suppression logo:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// GET /api/upload/logos - Lister les logos uploadés
router.get('/logos', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR)
      .filter(f => !f.startsWith('.'))
      .map(filename => ({
        filename,
        url: `/uploads/logos/${filename}`,
      }));

    res.json(files);
  } catch (err) {
    console.error('Erreur listing logos:', err);
    res.status(500).json({ error: 'Erreur lors du listing' });
  }
});

// Gestion erreurs multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux (max 2 Mo)' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
