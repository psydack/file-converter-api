const request = require('supertest');

process.env.WALLET_ADDRESS = '0xTestWalletAddressOnBase';
const app = require('../src/index');

describe('File Converter API', () => {
  test('GET / returns service info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('service', 'File Converter API');
  });

  test('POST /convert without payment returns 402 with payment-required header', async () => {
    const res = await request(app)
      .post('/convert')
      .send({ content: 'a,b\n1,2', from: 'csv', to: 'json' });

    expect(res.status).toBe(402);
    expect(res.headers).toHaveProperty('payment-required');

    const payload = JSON.parse(Buffer.from(res.headers['payment-required'], 'base64').toString('utf-8'));
    expect(payload.x402Version).toBe(2);
    expect(payload.accepts[0]).toHaveProperty('scheme', 'exact');
    expect(payload.accepts[0]).toHaveProperty('network', 'eip155:8453');
    expect(payload.accepts[0]).toHaveProperty('payTo');
    expect(payload.accepts[0]).toHaveProperty('asset');
    expect(payload.accepts[0]).toHaveProperty('amount');
  });

  test('POST /convert with payment succeeds', async () => {
    const res = await request(app)
      .post('/convert')
      .set('x-payment', 'test')
      .send({ content: 'a,b\n1,2', from: 'csv', to: 'json' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });
});