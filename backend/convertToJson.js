const fs = require('fs');
const pdfParse = require('pdf-parse');  // make sure pdf-parse is installed

const pdfPath = './Crime-and-Punishment-.pdf';

(async () => {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(pdfPath);

    // Extract text from PDF
    const data = await pdfParse(dataBuffer);

    // Split into lines and clean them
    const lines = data.text
      .split(/\r?\n/)              // split by newlines
      .map(line => line.trim())    // remove extra spaces
      .filter(line => line.length > 0); // remove blank lines

    // Group lines into pages of 30 lines each
    const pageSize = 30;
    const pages = [];
    for (let i = 0; i < lines.length; i += pageSize) {
      const chunk = lines.slice(i, i + pageSize).join('\n');
      if (chunk.trim().length > 100) { // skip near-empty pages
        pages.push(chunk);
      }
    }

    // Create JSON structure
    const snippets = pages.map((content, index) => ({
      title: `Page ${index + 1}`,
      content,
    }));

    // Write to JSON file
    fs.writeFileSync('./snippets.json', JSON.stringify(snippets, null, 2), 'utf-8');

    console.log(`✅ Created snippets.json with ${snippets.length} pages (30 lines each)!`);
  } catch (err) {
    console.error('❌ Error converting PDF:', err);
  }
})();
