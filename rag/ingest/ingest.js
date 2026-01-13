  // src/ingest.js
import { pool } from "../src/db.js";
import { embed } from "../src/embed.js";
import fs from 'fs';
import { fileURLToPath } from "url";
import path from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Get project root (parent of ingest directory)
const projectRoot = path.resolve(__dirname, '..');


export async function ingestDocument(source="local",filePath='./data/react.txt'){
  // Resolve file path from project root
  const absolutePath = path.resolve(projectRoot, filePath);
  const fileText = fs.readFileSync(absolutePath, "utf-8");

 // 🔑 Split by blank lines (meaningful chunks)
  const chunks = fileText
    .split(/\n\s*\n/)
    .map(c => c.trim())
    .filter(c => c.length > 50);

   console.log(`📦 Ingesting ${chunks.length} meaningful chunks`);


  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    console.log(`\n➡️ Chunk ${i + 1}:`);
    console.log(chunk.slice(0, 120), "...");

    const embeddingArray = await embed(chunk);
    
    // Validate embedding dimensions before inserting
    if (!Array.isArray(embeddingArray)) {
      throw new Error(`Invalid embedding for chunk ${i + 1}: expected array`);
    }
    
    if (embeddingArray.length !== 1536) {
      throw new Error(`Invalid embedding dimensions for chunk ${i + 1}: expected 1536, got ${embeddingArray.length}`);
    }
    
    const vectorString = `[${embeddingArray.join(",")}]`;

    await pool.query(
      `
     INSERT INTO documents (content, embedding, source)
      VALUES ($1, $2::vector, $3)
      `,
      [chunk, vectorString, source]
    );
  }

  console.log("✅ Ingestion completed");
 

}