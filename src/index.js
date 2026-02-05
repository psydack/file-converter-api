require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { convertFile, detectFormat } = require('./converter');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: ['text/csv', 'application/json', 'application/jsonl'], limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PORT = process.env.PORT || 3000;

if (!WALLET_ADDRESS) {
  console.error('❌ ERROR: WALLET_ADDRESS environment variable is required');
  console.error('Create a .env file with WALLET_ADDRESS=0xYourAddress');
  process.exit(1);
}

// x402 middleware
const requirePayment = (req, res, next) => {
  if (req.headers['x-payment']) return next();

  res.status(402);
  res.setHeader('PAYMENT-REQUIRED', Buffer.from(JSON.stringify({
    x402Version: 2,
    accepts: [{ scheme: 'exact', network: 'eip155:8453', amount: '250', payTo: WALLET_ADDRESS, asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }]
  })).toString('base64'));
  res.json({ message: 'Payment required', price: '$0.00025 USDC' });
};

/**
 * POST /convert
 * Convert file content between formats
 */
app.post('/convert', requirePayment, (req, res) => {
  const { content, from, to } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Missing required field: content' });
  }

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing required fields: from, to' });
  }

  try {
    const result = convertFile(content, from, to);
    res.json({
      success: true,
      from: from,
      to: to,
      records: result.records,
      data: result.data
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /convert/upload
 * Convert uploaded file
 */
app.post('/convert/upload', upload.single('file'), requirePayment, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { from, to } = req.body;
  const content = req.file.buffer.toString('utf-8');

  try {
    const detectedFrom = from || detectFormat(content, req.file.originalname);
    const result = convertFile(content, detectedFrom, to);

    res.json({
      success: true,
      from: detectedFrom,
      to: to,
      filename: req.file.originalname,
      records: result.records,
      data: result.data
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /
 */
app.get('/', (req, res) => {
  res.json({
    service: 'File Converter API',
    version: '1.0.0',
    endpoints: {
      convert: 'POST /convert (content in body)',
      upload: 'POST /convert/upload (multipart file upload)'
    },
    supported_formats: ['csv', 'json', 'jsonl'],
    max_file_size: '10MB',
    payment: { price: '$0.00025 USDC', network: 'Base' }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`File Converter API running on port ${PORT}`);
  });
}

module.exports = app;
