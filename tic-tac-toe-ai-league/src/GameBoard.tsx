import { useEffect, useState } from "react";
import { checkWinner, isBoardFull, getWinningLine } from "./aiStrategies";
import type { AIStrategy, Board, Player } from "./aiStrategies";

interface GameBoardProps {
  playerXStrategy: AIStrategy | null;
  playerOStrategy: AIStrategy | null;
  onGameEnd?: (winner: "X" | "O" | "draw") => void;
}

export function GameBoard({
  playerXStrategy,
  playerOStrategy,
  onGameEnd,
}: GameBoardProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [winner, setWinner] = useState<Player | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  useEffect(() => {
    if (playerXStrategy && playerOStrategy && !gameStarted) {
      setGameStarted(true);
      setBoard(Array(9).fill(null));
      setCurrentPlayer("X");
      setWinner(null);
      setIsDraw(false);
      setWinningLine(null);
    }
  }, [playerXStrategy, playerOStrategy, gameStarted]);

  useEffect(() => {
    if (!gameStarted || !playerXStrategy || !playerOStrategy) return;
    if (winner || isDraw) return;

    const currentStrategy =
      currentPlayer === "X" ? playerXStrategy : playerOStrategy;

    // Add a small delay to make moves visible
    setIsThinking(true);
    const timer = setTimeout(async () => {
      const moveResult = currentStrategy.makeMove(board, currentPlayer);
      const move =
        moveResult instanceof Promise ? await moveResult : moveResult;

      if (move === -1 || board[move] !== null) {
        setIsThinking(false);
        return;
      }

      const newBoard = [...board];
      newBoard[move] = currentPlayer;
      setBoard(newBoard);

      const gameWinner = checkWinner(newBoard);
      if (gameWinner && (gameWinner === "X" || gameWinner === "O")) {
        const line = getWinningLine(newBoard);
        setWinner(gameWinner);
        setWinningLine(line);
        setIsThinking(false);
        onGameEnd?.(gameWinner);
        return;
      }

      if (isBoardFull(newBoard)) {
        setIsDraw(true);
        setIsThinking(false);
        onGameEnd?.("draw");
        return;
      }

      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      setIsThinking(false);
    }, 500); // 500ms delay between moves

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    board,
    currentPlayer,
    playerXStrategy,
    playerOStrategy,
    winner,
    isDraw,
    gameStarted,
  ]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setIsDraw(false);
    setGameStarted(false);
    setWinningLine(null);
  };

  const getCellValue = (index: number) => {
    return board[index] || "";
  };

  const getStatusMessage = () => {
    if (isThinking) {
      return `${
        currentPlayer === "X" ? playerXStrategy?.name : playerOStrategy?.name
      } is thinking...`;
    }
    if (winner) {
      return `Winner: ${winner} (${
        winner === "X" ? playerXStrategy?.name : playerOStrategy?.name
      })`;
    }
    if (isDraw) {
      return "It's a draw!";
    }
    if (!playerXStrategy || !playerOStrategy) {
      return "Select AI strategies for both players to start";
    }
    return `Current player: ${currentPlayer} (${
      currentPlayer === "X" ? playerXStrategy?.name : playerOStrategy?.name
    })`;
  };

  const getLineClass = () => {
    if (!winningLine) return "";

    const [a, b, c] = winningLine;
    // Check if it's a row (0-2, 3-5, 6-8)
    if (
      Math.floor(a / 3) === Math.floor(b / 3) &&
      Math.floor(b / 3) === Math.floor(c / 3)
    ) {
      const row = Math.floor(a / 3);
      return `win-line-row row-${row}`;
    }
    // Check if it's a column (0,3,6 or 1,4,7 or 2,5,8)
    if (a % 3 === b % 3 && b % 3 === c % 3) {
      const col = a % 3;
      return `win-line-col col-${col}`;
    }
    // Check if it's a diagonal
    if (a === 0 && b === 4 && c === 8) {
      return "win-line-diagonal diagonal-main";
    }
    if (a === 2 && b === 4 && c === 6) {
      return "win-line-diagonal diagonal-anti";
    }
    return "";
  };

  return (
    <div className="game-container">
      <div className="game-status">{getStatusMessage()}</div>
      <div className="board">
        {board.map((_, index) => (
          <div
            key={index}
            className={`cell ${
              board[index] ? `cell-${board[index].toLowerCase()}` : ""
            } ${isThinking ? "thinking" : ""} ${
              winningLine?.includes(index) ? "winning-cell" : ""
            }`}
          >
            {getCellValue(index)}
          </div>
        ))}
        {winningLine && (
          <div
            className={`win-line ${getLineClass()} ${
              winner === "X" ? "win-line-x" : "win-line-o"
            }`}
          ></div>
        )}
      </div>
      {(winner || isDraw) && (
        <button className="reset-button" onClick={resetGame}>
          Play Again
        </button>
      )}
    </div>
  );
}
