require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Snippets = require("./models/Snippet");
const ConnectDB = require("./config/db");

ConnectDB();

const folderPath = path.join(__dirname, "snippets");

function getPageNoFromFilename(filename) {
  // works for page252.txt, page253.txt, etc.
  const match = filename.toLowerCase().match(/^page(\d+)\.txt$/);
  return match ? Number(match[1]) : null;
}

async function getLastInsertedPageNo() {
  const last = await Snippets.aggregate([
    {
      $addFields: {
        pageNo: {
          $toInt: { $arrayElemAt: [{ $split: ["$title", " "] }, 1] },
        },
      },
    },
    { $sort: { pageNo: -1 } },
    { $limit: 1 },
  ]);

  return last?.[0]?.pageNo || 0;
}

async function seedAppend() {
  try {
    const lastPageNo = await getLastInsertedPageNo();
    console.log("Last inserted page in DB:", lastPageNo);

    const files = fs
      .readdirSync(folderPath)
      .filter((f) => f.toLowerCase().endsWith(".txt"));

    const toInsert = [];

    for (const file of files) {
      const pageNo = getPageNoFromFilename(file);
      if (!pageNo) continue;

      // only add new pages
      if (pageNo <= lastPageNo) continue;

      const filePath = path.join(folderPath, file);
      const content = fs.readFileSync(filePath, "utf-8").trim();

      if (!content) {
        console.warn(`⚠️ Skipping empty file: ${file}`);
        continue;
      }

      toInsert.push({
        title: `Page ${pageNo}`,
        content,
      });
    }

    if (!toInsert.length) {
      console.log("No new pages found to insert.");
      process.exit(0);
    }

    // Duplicate-safety (if you accidentally run script again)
    const titles = toInsert.map((s) => s.title);
    const existing = await Snippets.find(
      { title: { $in: titles } },
      { title: 1, _id: 0 }
    ).lean();
    const existingSet = new Set(existing.map((e) => e.title));

    const finalInsert = toInsert.filter((s) => !existingSet.has(s.title));

    if (!finalInsert.length) {
      console.log("All new pages already exist in DB (nothing inserted).");
      process.exit(0);
    }

    await Snippets.insertMany(finalInsert, { ordered: false });
    console.log(`✅ Inserted ${finalInsert.length} new pages successfully!`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seedAppend();
