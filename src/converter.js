/**
 * File converter utilities
 */

const { parse: csvParse } = require('csv-parse/sync');
const { stringify: csvStringify } = require('csv-stringify/sync');

/**
 * Detect file format from content or extension
 */
function detectFormat(content, filename) {
  if (filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['csv', 'json', 'jsonl'].includes(ext)) return ext;
  }

  // Try to detect from content
  try {
    JSON.parse(content);
    return 'json';
  } catch {
    // Not JSON
  }

  if (content.trim().split('\n').every(line => {
    const parts = line.split(',');
    return parts.length > 1;
  })) {
    return 'csv';
  }

  if (content.trim().split('\n').every(line => {
    try { JSON.parse(line); return true; } catch { return false; }
  })) {
    return 'jsonl';
  }

  return 'unknown';
}

/**
 * Parse CSV to JSON
 */
function csvToJson(csv, options = {}) {
  const records = csvParse(csv, {
    columns: true,
    skip_empty_lines: true,
    ...options
  });
  return records;
}

/**
 * Convert JSON to CSV
 */
function jsonToCsv(json, options = {}) {
  const csv = csvStringify(json, {
    header: true,
    ...options
  });
  return csv;
}

/**
 * Parse JSONL to JSON array
 */
function jsonlToJson(jsonl) {
  const lines = jsonl.trim().split('\n');
  return lines.map(line => JSON.parse(line));
}

/**
 * Convert JSON to JSONL
 */
function jsonToJsonl(json) {
  const records = Array.isArray(json) ? json : [json];
  return records.map(record => JSON.stringify(record)).join('\n') + '\n';
}

/**
 * Main conversion function
 */
function convertFile(content, fromFormat, toFormat) {
  let data;

  // Parse input
  switch (fromFormat) {
    case 'csv':
      data = csvToJson(content);
      break;
    case 'json':
      data = JSON.parse(content);
      break;
    case 'jsonl':
      data = jsonlToJson(content);
      break;
    default:
      throw new Error(`Unsupported input format: ${fromFormat}`);
  }

  // Convert output
  switch (toFormat) {
    case 'csv':
      return {
        data: jsonToCsv(data),
        format: 'csv',
        records: Array.isArray(data) ? data.length : 1
      };
    case 'json':
      return {
        data: JSON.stringify(data, null, 2),
        format: 'json',
        records: Array.isArray(data) ? data.length : 1
      };
    case 'jsonl':
      return {
        data: jsonToJsonl(data),
        format: 'jsonl',
        records: Array.isArray(data) ? data.length : 1
      };
    default:
      throw new Error(`Unsupported output format: ${toFormat}`);
  }
}

module.exports = {
  detectFormat,
  convertFile,
  csvToJson,
  jsonToCsv,
  jsonlToJson,
  jsonToJsonl
};
