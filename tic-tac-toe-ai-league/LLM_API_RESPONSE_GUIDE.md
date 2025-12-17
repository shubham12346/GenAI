# Understanding LLM API Response Structure

## Response Overview

The response you're receiving is from the Vercel AI SDK (or similar API). Here's what each key field means:

## Key Fields Explained

### 1. **Top-Level Metadata**
```json
{
  "id": "resp_...",           // Unique response ID
  "object": "response",        // Type of object
  "created_at": 1765951453,    // Unix timestamp when created
  "status": "completed",       // Status: "completed", "processing", etc.
  "model": "gpt-3.5-turbo-0125" // Model used
}
```

### 2. **The Actual Response Content** ⭐
```json
"output": [
  {
    "id": "msg_...",
    "type": "message",
    "status": "completed",
    "content": [
      {
        "type": "output_text",
        "text": "4"  // 👈 THIS IS THE MOVE! (0-8)
      }
    ],
    "role": "assistant"
  }
]
```

**To extract the move:**
```javascript
const moveText = response.output[0].content[0].text; // "4"
const move = parseInt(moveText.trim(), 10); // 4
```

### 3. **Usage Information**
```json
"usage": {
  "input_tokens": 154,   // Tokens in your prompt
  "output_tokens": 2,    // Tokens in response (just "4")
  "total_tokens": 156    // Total tokens used
}
```

### 4. **Configuration**
```json
{
  "temperature": 1.0,    // Randomness (0-2, higher = more random)
  "top_p": 1.0,          // Nucleus sampling parameter
  "max_output_tokens": null  // Max tokens in response
}
```

## Current Code vs. Response Structure

Your current code uses `generateText()` which should return:
```javascript
const { text } = await generateText({...});
// text = "4" directly
```

But the response you're seeing suggests you might be:
1. Using a different API endpoint
2. Logging the raw response object
3. Using a different SDK method

## How to Handle This Response

### Option 1: If using `generateText()` (current code)
```javascript
const { text } = await generateText({...});
const move = parseInt(text.trim(), 10);
// text is already "4", no need to navigate nested objects
```

### Option 2: If you have the full response object
```javascript
// Extract from nested structure
const moveText = response.output[0].content[0].text;
const move = parseInt(moveText.trim(), 10);

// Or use optional chaining for safety
const moveText = response?.output?.[0]?.content?.[0]?.text;
const move = moveText ? parseInt(moveText.trim(), 10) : -1;
```

### Option 3: Helper function to extract move
```javascript
function extractMoveFromResponse(response) {
  try {
    // Check if it's the direct text format (from generateText)
    if (typeof response === 'string') {
      return parseInt(response.trim(), 10);
    }
    
    // Check if it's the full response object
    if (response?.output?.[0]?.content?.[0]?.text) {
      return parseInt(response.output[0].content[0].text.trim(), 10);
    }
    
    // Check if it's already extracted
    if (response?.text) {
      return parseInt(response.text.trim(), 10);
    }
    
    return -1; // Invalid
  } catch (error) {
    console.error('Error extracting move:', error);
    return -1;
  }
}
```

## Response Status Values

- `"completed"` ✅ - Successfully generated response
- `"processing"` ⏳ - Still generating
- `"error"` ❌ - Something went wrong (check `error` field)

## Error Handling

If `status !== "completed"`, check:
```json
{
  "error": {
    "message": "Error description",
    "type": "error_type"
  }
}
```

## Example: Complete Extraction

```javascript
async function makeMoveWithLLM(board, player) {
  const response = await callLLMAPI(...);
  
  // Check status
  if (response.status !== 'completed') {
    console.error('API call failed:', response.error);
    return -1; // Fallback move
  }
  
  // Extract move
  const moveText = response.output[0].content[0].text;
  const move = parseInt(moveText.trim(), 10);
  
  // Validate
  if (isNaN(move) || move < 0 || move > 8) {
    console.error('Invalid move received:', moveText);
    return -1;
  }
  
  return move;
}
```

## Quick Reference

| Field Path | Value | Purpose |
|------------|-------|---------|
| `response.output[0].content[0].text` | `"4"` | **The actual move** |
| `response.status` | `"completed"` | Request status |
| `response.model` | `"gpt-3.5-turbo-0125"` | Model used |
| `response.usage.total_tokens` | `156` | Cost tracking |
| `response.error` | `null` | Error info (if any) |

