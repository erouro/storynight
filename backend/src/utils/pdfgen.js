const PDFDocument = require('pdfkit');
const { get } = require('../db');

function storyToPdfStream(story){
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.fontSize(18).text(story.title, { underline: true });
  doc.moveDown();
  if (story.author_name) doc.fontSize(12).text('Author: ' + story.author_name);
  doc.fontSize(10).text('Published: ' + new Date(story.created_at).toLocaleString());
  doc.moveDown();
  doc.fontSize(12).text(story.content || '', { align: 'left' });
  doc.end();
  return doc;
}

module.exports = { storyToPdfStream };
