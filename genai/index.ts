console.log("Hello World");

// 1st methdode - genertae text
import { config } from "dotenv";
import { generateText, streamText, generateObject, streamObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

config();

const openai = createOpenAI({
	apiKey: process.env.OPEN_AI_KEY,
});

const TextGeneration = async () => {
	const { text } = await generateText({
		model: openai("gpt-4-turbo"),
		prompt: "What is today's date?",
	});

	console.log(text);
};

// TextGeneration();

// 2nd  stream text

const streamTextGeneration = async () => {
	const { textStream } = await streamText({
		model: openai("gpt-4o"),
		prompt:
			"give me summary fo fifa word cup 2022 , my output should be in the following format :[{team1_name:string, team2_name:string, team1_score:number, team2_score:number, winner:string}]",
	});

	for await (let chunk of textStream) {
		process.stdout.write(chunk);
		console.log(chunk);
	}
};

// streamTextGeneration();

// generrate objetc

const objectGeneration = async () => {
	const { object } = await generateObject({
		model: openai("gpt-4o"),
		prompt: "give me summary fo fifa word cup 2022 ",
		schema: z.object({
			matches: z.array(
				z.object({
					team1_name: z.string(),
					team2_name: z.string(),
					team1_score: z.number(),
					team2_score: z.number(),
					winner: z.string(),
				})
			),
		}),
	});

	console.log(object);
};

objectGeneration();

// stream object

// Assignment ->
