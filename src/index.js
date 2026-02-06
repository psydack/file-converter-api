require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { convertFile, detectFormat } = require('./converter');
const { paymentMiddleware } = require('@x402/express');
const { x402ResourceServer, HTTPFacilitatorClient } = require('@x402/core/server');
const { registerExactEvmScheme } = require('@x402/evm/exact/server');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: ['text/csv', 'application/json', 'application/jsonl'], limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PORT = process.env.APP_PORT || process.env.PORT || 3000;
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'https://x402.org/facilitator';
const NETWORK = process.env.NETWORK || 'eip155:84532';
const PRICE = '$0.00025';

if (!WALLET_ADDRESS) {
  console.error('❌ ERROR: WALLET_ADDRESS environment variable is required');
  console.error('Create a .env file with WALLET_ADDRESS=0xYourAddress');
  process.exit(1);
}

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const x402Server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(x402Server);

const x402Routes = {
  'POST /convert': {
    accepts: [{ scheme: 'exact', price: PRICE, network: NETWORK, payTo: WALLET_ADDRESS }],
    description: 'Convert content between CSV, JSON, and JSONL',
    mimeType: 'application/json'
  },
  'POST /convert/upload': {
    accepts: [{ scheme: 'exact', price: PRICE, network: NETWORK, payTo: WALLET_ADDRESS }],
    description: 'Convert uploaded file between formats',
    mimeType: 'multipart/form-data'
  }
};

app.use(paymentMiddleware(x402Routes, x402Server));

/**
 * POST /convert
 * Convert file content between formats
 */
app.post('/convert', (req, res) => {
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
app.post('/convert/upload', upload.single('file'), (req, res) => {
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
