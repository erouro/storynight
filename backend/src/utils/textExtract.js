const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

async function extractTextFromFile(filePath, mimetype){
  // mimetype from multer
  const ext = (mimetype || '').toLowerCase();
  const buffer = fs.readFileSync(filePath);
  if (ext.includes('pdf') || filePath.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return data.text || '';
  } else if (ext.includes('word') || filePath.endsWith('.docx')) {
    const res = await mammoth.extractRawText({ buffer });
    return res.value || '';
  } else {
    // plain text
    return buffer.toString('utf8');
  }
}

module.exports = { extractTextFromFile };
