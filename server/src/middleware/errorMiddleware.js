import multer from 'multer';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Errori Multer
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File troppo grande. Dimensione massima: 5MB'
      });
    }
    return res.status(400).json({
      message: 'Errore durante l\'upload del file'
    });
  }

  // Altri errori
  if (err.message) {
    return res.status(err.status || 500).json({
      message: err.message
    });
  }

  res.status(500).json({
    message: 'Errore interno del server'
  });
};

// Esporta anche un middleware per la gestione degli errori a livello di route
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
