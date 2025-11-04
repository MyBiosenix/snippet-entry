require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Snippets = require('./models/Snippet');
const ConnectDB = require('./config/db');

ConnectDB();

const folderPath = path.join(__dirname, 'snippets');

const seedSnippets = async () => {
  try {
    const files = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.txt'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.match(/\d+/)?.[0] || 0);
        return numA - numB;
      });

    const snippets = [];

    files.forEach((file, index) => {
      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, 'utf-8').trim();

      if (!content) {
        console.warn(`⚠️ Skipping empty file: ${file}`);
        return;
      }

      snippets.push({
        title: `Page ${index + 1}`,
        content
      });
    });

    await Snippets.deleteMany({});
    await Snippets.insertMany(snippets);

    console.log(`${snippets.length} valid pages inserted successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding snippets:', err);
    process.exit(1);
  }
};

seedSnippets();
