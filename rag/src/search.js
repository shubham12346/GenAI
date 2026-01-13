// src/search.js
import { pool } from "./db.js";
import { embed } from "./embed.js";

export function toPgVector(arr) {
  return `[${arr.join(",")}]`;
}

export async function searchDocuments(question, limit = 5, maxDistance = 0.5) {
  const embedding = await embed(question);

  console.log("*********");
  console.log("Question embedding length:", embedding.length);
  


  const vector = toPgVector(embedding);
  
 

 // Workaround: Fetch all results and limit in JavaScript
 // There's an issue with LIMIT and parameterized vector queries in this PostgreSQL/pgvector setup
 const res = await pool.query(
    `
    SELECT
      id,
      content,
      (embedding <=> $1::vector) AS distance
    FROM documents
    ORDER BY (embedding <=> $1::vector)
    `,
    [vector]
  );
  
  // Filter by similarity threshold and limit results
  // Distance is cosine distance: 0 = identical, 1 = completely different
  // Lower distance = more similar
  const filteredResults = res.rows
    .filter(r => Number(r.distance) <= maxDistance)
    .slice(0, limit);

  console.log(
    "🔎 Search results:",
    filteredResults.map(r => ({
      distance: Number(r.distance).toFixed(3),
      preview: r.content.slice(0, 60)
    }))
  );

  if (filteredResults.length === 0) {
    console.log(`⚠️  No documents found within similarity threshold (maxDistance: ${maxDistance})`);
  }

  return filteredResults;
}
