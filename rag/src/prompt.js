//src/prompt.js

export function buildPrompt(context,question){
    return`
      You are an expert assistant.
      Answer ONLY using the context below.
      If the answer is not present, say "I don't know".

      Context:
      ${context}

      Question:
      ${question}
    `;
}