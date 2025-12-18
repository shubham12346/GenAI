import type { AIStrategy, Board, Player } from "./aiStrategies";
import { checkWinner, isBoardFull, getAvailableMoves } from "./aiStrategies";

export type MatchResult = "X" | "O" | "draw";

export interface MatchResultWithDetails {
  result: MatchResult;
  playerX: string;
  playerO: string;
}

/**
 * Runs a single tic-tac-toe match between two AI strategies
 * Returns the winner or "draw"
 */
export async function runMatch(
  playerXStrategy: AIStrategy,
  playerOStrategy: AIStrategy
): Promise<MatchResult> {
  let board: Board = Array(9).fill(null);
  let currentPlayer: Player = "X";
  const maxMoves = 100; // Safety limit to prevent infinite loops
  let moveCount = 0;

  while (moveCount < maxMoves) {
    const winner = checkWinner(board);
    if (winner === "X" || winner === "O") {
      return winner;
    }

    if (isBoardFull(board)) {
      return "draw";
    }

    const currentStrategy =
      currentPlayer === "X" ? playerXStrategy : playerOStrategy;

    try {
      const moveResult = currentStrategy.makeMove(board, currentPlayer);
      const move =
        moveResult instanceof Promise ? await moveResult : moveResult;

      if (move === -1 || move < 0 || move > 8 || board[move] !== null) {
        // Invalid move - try to find a valid move
        const availableMoves = getAvailableMoves(board);
        if (availableMoves.length === 0) {
          return "draw";
        }
        // Use first available move as fallback
        board[availableMoves[0]] = currentPlayer;
      } else {
        board[move] = currentPlayer;
      }

      moveCount++;
      currentPlayer = currentPlayer === "X" ? "O" : "X";
    } catch (error) {
      console.error(
        `Error in match between ${playerXStrategy.name} and ${playerOStrategy.name}:`,
        error
      );
      // On error, return draw
      return "draw";
    }
  }

  // If we hit max moves, it's a draw
  return "draw";
}

