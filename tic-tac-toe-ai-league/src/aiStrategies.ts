// AI Strategy Types
export type Player = 'X' | 'O' | null;
export type Board = Player[];

export interface AIStrategy {
  name: string;
  makeMove(board: Board, player: Player): number | Promise<number>;
}

// Check if a player has won
export function checkWinner(board: Board): Player | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

// Get the winning line indices
export function getWinningLine(board: Board): number[] | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

// Check if board is full
export function isBoardFull(board: Board): boolean {
  return board.every(cell => cell !== null);
}

// Get available moves
function getAvailableMoves(board: Board): number[] {
  return board.map((cell, index) => cell === null ? index : -1).filter(index => index !== -1);
}

// Random AI Strategy
export const randomAI: AIStrategy = {
  name: 'Random AI',
  makeMove(board: Board, _player: Player): number {
    const availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) return -1;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }
};

// Center-first AI Strategy
export const centerFirstAI: AIStrategy = {
  name: 'Center First AI',
  makeMove(board: Board, _player: Player): number {
    const availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) return -1;
    
    // Try center first
    if (board[4] === null) return 4;
    
    // Try corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => board[corner] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Random from remaining
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }
};

// Defensive AI Strategy (blocks opponent wins)
export const defensiveAI: AIStrategy = {
  name: 'Defensive AI',
  makeMove(board: Board, player: Player): number {
    const availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) return -1;
    
    const opponent: Player = player === 'X' ? 'O' : 'X';
    
    // Try to win
    for (const move of availableMoves) {
      const testBoard = [...board];
      testBoard[move] = player;
      if (checkWinner(testBoard) === player) {
        return move;
      }
    }
    
    // Block opponent from winning
    for (const move of availableMoves) {
      const testBoard = [...board];
      testBoard[move] = opponent;
      if (checkWinner(testBoard) === opponent) {
        return move;
      }
    }
    
    // Center if available
    if (board[4] === null) return 4;
    
    // Random
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }
};

// Minimax AI Strategy (optimal play)
export const minimaxAI: AIStrategy = {
  name: 'Minimax AI',
  makeMove(board: Board, player: Player): number {
    const availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) return -1;
    
    let bestMove = -1;
    let bestScore = -Infinity;
    
    for (const move of availableMoves) {
      const testBoard = [...board];
      testBoard[move] = player;
      const score = minimax(testBoard, 0, false, player);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
};

function minimax(board: Board, depth: number, isMaximizing: boolean, player: Player): number {
  const opponent: Player = player === 'X' ? 'O' : 'X';
  const winner = checkWinner(board);
  
  if (winner === player) return 10 - depth;
  if (winner === opponent) return depth - 10;
  if (isBoardFull(board)) return 0;
  
  const availableMoves = getAvailableMoves(board);
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const move of availableMoves) {
      const testBoard = [...board];
      testBoard[move] = player;
      const score = minimax(testBoard, depth + 1, false, player);
      bestScore = Math.max(bestScore, score);
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (const move of availableMoves) {
      const testBoard = [...board];
      testBoard[move] = opponent;
      const score = minimax(testBoard, depth + 1, true, player);
      bestScore = Math.min(bestScore, score);
    }
    return bestScore;
  }
}

// Aggressive AI Strategy (tries to win, less defensive)
export const aggressiveAI: AIStrategy = {
  name: 'Aggressive AI',
  makeMove(board: Board, player: Player): number {
    const availableMoves = getAvailableMoves(board);
    if (availableMoves.length === 0) return -1;
    
    const opponent: Player = player === 'X' ? 'O' : 'X';
    
    // Try to win
    for (const move of availableMoves) {
      const testBoard = [...board];
      testBoard[move] = player;
      if (checkWinner(testBoard) === player) {
        return move;
      }
    }
    
    // Try corners first
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => board[corner] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Center if available
    if (board[4] === null) return 4;
    
    // Block if necessary
    for (const move of availableMoves) {
      const testBoard = [...board];
      testBoard[move] = opponent;
      if (checkWinner(testBoard) === opponent) {
        return move;
      }
    }
    
    // Random
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }
};

// Helper function to format board for OpenAI
function formatBoardForAI(board: Board): string {
  const rows = [];
  for (let i = 0; i < 3; i++) {
    const row = [];
    for (let j = 0; j < 3; j++) {
      const index = i * 3 + j;
      row.push(board[index] || '_');
    }
    rows.push(row.join(' '));
  }
  return rows.join('\n');
}

// Helper function to get available moves as list
function getAvailableMovesList(board: Board): number[] {
  return getAvailableMoves(board);
}

// Helper function to create LLM-based AI strategies
function createLLMStrategy(modelName: string, displayName: string): AIStrategy {
  return {
    name: displayName,
    async makeMove(board: Board, player: Player): Promise<number> {
      const availableMoves = getAvailableMovesList(board);
      if (availableMoves.length === 0) return -1;

      // Import OpenAI client here to avoid issues
      const { generateText } = await import("ai");
      const { createOpenAI } = await import("@ai-sdk/openai");
      
      const openai = createOpenAI({
        apiKey: import.meta.env.VITE_APP_OPENAI,
      });

      const boardState = formatBoardForAI(board);
      const opponent = player === 'X' ? 'O' : 'X';
      
      const maxRetries = 5;
      let attempts = 0;
      
      while (attempts < maxRetries) {
        try {
          const { text } = await generateText({
            model: openai(modelName),
            prompt: `You are playing Tic-Tac-Toe. You are player ${player}, and your opponent is ${opponent}.

Current board state:
${boardState}

Available moves (cell indices): ${availableMoves.join(', ')}

Rules:
- The board is a 3x3 grid with indices 0-8 (top-left to bottom-right)
- You are ${player}
- Try to win if possible, block opponent if they can win, otherwise make a strategic move
- Return ONLY a valid move index (0-8) from the available moves list as a single number

Make your move (return only the number):`,
          });

          const move = parseInt(text.trim(), 10);
          
          // Validate the move
          if (!isNaN(move) && availableMoves.includes(move)) {
            return move;
          }
          
          // If invalid move, retry
          attempts++;
          if (attempts < maxRetries) {
            console.warn(`${displayName}: Invalid move received (${text.trim()}), retrying... (attempt ${attempts}/${maxRetries})`);
            continue;
          }
        } catch (error) {
          attempts++;
          console.error(`${displayName} error (attempt ${attempts}/${maxRetries}):`, error);
          
          // If we've exhausted retries, throw the error
          if (attempts >= maxRetries) {
            throw error;
          }
          
          // Otherwise, retry
          continue;
        }
      }
      
      // If we somehow get here, fallback to first available move
      return availableMoves[0];
    }
  };
}

// LLM Model Strategies - Using OpenAI models
export const gpt4oAI = createLLMStrategy('gpt-4o', 'GPT-4o');
export const gpt4AI = createLLMStrategy('gpt-4', 'GPT-4');
export const gpt4TurboAI = createLLMStrategy('gpt-4-turbo', 'GPT-4 Turbo');
export const gpt4oMiniAI = createLLMStrategy('gpt-4o-mini', 'GPT-4o-mini');
export const gpt35TurboAI = createLLMStrategy('gpt-3.5-turbo', 'GPT-3.5 Turbo');

// Traditional AI Strategies (non-LLM)
export const traditionalStrategies: AIStrategy[] = [
  randomAI,
  centerFirstAI,
  defensiveAI,
  aggressiveAI,
  minimaxAI
];

// LLM-based Strategies
export const llmStrategies: AIStrategy[] = [
  gpt4oAI,
  gpt4AI,
  gpt4TurboAI,
  gpt4oMiniAI,
  gpt35TurboAI
];

// Export all strategies combined
export const aiStrategies: AIStrategy[] = [
  ...traditionalStrategies,
  ...llmStrategies
];

