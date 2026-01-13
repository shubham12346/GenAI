import {ingestDocument} from './ingest.js';

await ingestDocument("local",'../data/react.txt');

console.log("✅ Ingestion completed");
process.exit(0);