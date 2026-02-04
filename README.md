# File Converter API

Convert files between CSV, JSON, and JSONL formats with x402 micropayments.

## 🌟 Features

- ✅ **CSV ↔ JSON** - Bidirectional conversion
- ✅ **JSON ↔ JSONL** - Bidirectional conversion  
- ✅ **CSV ↔ JSONL** - Via JSON as intermediate
- ✅ **Auto-detection** - Detect format from content or filename
- ✅ **File Upload** - Multipart upload support
- ✅ **Direct Content** - Send content in request body
- ✅ **10MB Limit** - Handle reasonably large files
- ✅ **x402 Payments** - $0.0005 USDC per conversion

## 📋 Endpoints

### POST /convert

Convert file content sent in request body.

```http
POST /convert
Content-Type: application/json

{
  "content": "name,age\nJohn,30\nJane,25",
  "from": "csv",
  "to": "json"
}
```

### POST /convert/upload

Convert uploaded file (multipart/form-data).

```bash
curl -X POST http://localhost:3000/convert/upload \
  -F "file=@data.csv" \
  -F "to=jsonl"
```

## 💰 Payments

- **Price**: $0.0005 USDC per conversion
- **Network**: Base (Chain ID 8453)
- **Protocol**: x402 v2

## 📝 License

ISC

---

**Built for Clawmart x402 Marketplace** 📁

**Repository**: https://github.com/psydack/file-converter-api
