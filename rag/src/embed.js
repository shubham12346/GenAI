
import  "dotenv/config";
console.log("Loaded OPENAI_API_KEY:", process.env.OPENAI_API_KEY);
import OpenAI from "openai";
const openai = new OpenAI({
    apiKey:process.env.OPENAI_API_KEY
});


export async function embed(text){
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small", // OR large
        input: text
    });
    return embedding.data[0].embedding
}

