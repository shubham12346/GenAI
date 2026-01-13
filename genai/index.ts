console.log("Hello World");

// 1st methdode - genertae text
import { config } from "dotenv";
import { generateText, streamText, generateObject, streamObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import OpenAI from "openai";

import { z } from "zod";
import { CloudClient } from "chromadb";
import fs from "fs/promises"
config();

// const openai = createOpenAI({
// 	apiKey: process.env.OPEN_AI_KEY,
// });


const openai = new OpenAI({
	apiKey:process.env.OPEN_AI_KEY
});
const client = new CloudClient({
  apiKey: 'ck-xVz6AdZccnqMnFDJjXhUF8L4PERUmfBiqhQL3EsWHSr',
  tenant: 'baded405-23d0-4429-be2c-58fecda6ad8d',
  database: 'embeddingDb'
});


// const TextGeneration = async () => {
// 	const { text } = await generateText({
// 		model: openai("gpt-4-turbo"),
// 		prompt: "What is today's date?",
// 	});

// 	console.log(text);
// };

// TextGeneration();

// 2nd  stream text

// const streamTextGeneration = async () => {
// 	const { textStream } = await streamText({
// 		model: openai("gpt-4o"),
// 		prompt:
// 			"give me summary fo fifa word cup 2022 , my output should be in the following format :[{team1_name:string, team2_name:string, team1_score:number, team2_score:number, winner:string}]",
// 	});

// 	for await (let chunk of textStream) {
// 		process.stdout.write(chunk);
// 		console.log(chunk);
// 	}
// };

// streamTextGeneration();

// generrate objetc

// const objectGeneration = async () => {
// 	const { object } = await generateObject({
// 		model: openai("gpt-4o"),
// 		prompt: "give me summary fo fifa word cup 2022 ",
// 		schema: z.object({
// 			matches: z.array(
// 				z.object({
// 					team1_name: z.string(),
// 					team2_name: z.string(),
// 					team1_score: z.number(),
// 					team2_score: z.number(),
// 					winner: z.string(),
// 				})
// 			),
// 		}),
// 	});

// 	console.log(object);
// };

// objectGeneration();

// stream object

// Assignment ->


const readFile = async()=>{
	try{
		const read = await fs.readFile('./random.txt','utf-8');
		console.log('data',read)
		const allWords = read.split(" ");
		console.log("allwords",allWords)
		const embeds = await EmbedArrayOfString(allWords)
		console.log("embeds",embeds)
	}catch (errro){
      console.log("error",errro)
	}

}

const EmbedArrayOfString = async(allwords:string[])=>{
  const embeddings = [];
  for (const chunk of allwords) {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002", // A common and effective embedding model
      input: chunk,
    });
    embeddings.push({
      text: chunk,
      embedding: response.data[0].embedding,
    });
  }
  return embeddings;
}



readFile();
