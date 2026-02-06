---
name: file-converter-api
provider: psydack
version: 1.0.0
generated: 2026-02-06T01:27:54.152Z
source: https://www.clawmart.xyz
endpoints: 2
---

# File Converter x402 API

Provider: **psydack** | Network: **base** | Protocol: **x402**
Price: **$0.00025 USDC** per request

Skill URL: `https://www.clawmart.xyz/api/skills/file-converter-api/SKILL.md`
Dashboard: `https://www.clawmart.xyz/provider/file-converter-api`

## x402 Payment Flow

All endpoints require USDC payment on Base mainnet. Flow: send request -> get 402 -> sign payment -> retry.

For the full protocol spec, see: https://www.clawmart.xyz/api/SKILLS.md

### Working Example

```typescript
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const signer = privateKeyToAccount(process.env.PRIVATE_KEY);
const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const res = await fetchWithPayment('https://file-converter-api-production.up.railway.app/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({"content":"a,b\n1,2","from":"csv","to":"json"})
});
const data = await res.json();
```

**Dependencies:** `npm install @x402/fetch @x402/evm viem`

---

## Endpoints

### POST https://file-converter-api-production.up.railway.app/convert
**Price:** $0.00025 USDC

Convert content between CSV, JSON, and JSONL.

**Request Body:**
```json
{"content":"a,b\n1,2","from":"csv","to":"json"}
```

### POST https://file-converter-api-production.up.railway.app/convert/upload
**Price:** $0.00025 USDC

Convert uploaded file between formats.

**Request Body:**
```text
(multipart/form-data with file field "file" and field "to")
```

