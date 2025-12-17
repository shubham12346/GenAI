import { useState, useCallback } from "react";
import { GameBoard } from "./GameBoard";
import {
  aiStrategies,
  traditionalStrategies,
  llmStrategies,
} from "./aiStrategies";
import type { AIStrategy } from "./aiStrategies";

function App() {
  const [playerXStrategy, setPlayerXStrategy] = useState<AIStrategy | null>(
    null
  );
  const [playerOStrategy, setPlayerOStrategy] = useState<AIStrategy | null>(
    null
  );
  const [gameStats, setGameStats] = useState({ xWins: 0, oWins: 0, draws: 0 });

  const handleGameEnd = useCallback((result: "X" | "O" | "draw") => {
    if (result === "X") {
      setGameStats((prev) => ({ ...prev, xWins: prev.xWins + 1 }));
    } else if (result === "O") {
      setGameStats((prev) => ({ ...prev, oWins: prev.oWins + 1 }));
    } else {
      setGameStats((prev) => ({ ...prev, draws: prev.draws + 1 }));
    }
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🎮 AI vs AI Tic-Tac-Toe League</h1>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">X Wins:</span>
            <span className="stat-value">{gameStats.xWins}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">O Wins:</span>
            <span className="stat-value">{gameStats.oWins}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Draws:</span>
            <span className="stat-value">{gameStats.draws}</span>
          </div>
        </div>
      </header>

      <div className="main-container">
        <div className="player-selector player-x">
          <h2>Player X</h2>
          <select
            value={playerXStrategy?.name || ""}
            onChange={(e) => {
              const strategy = aiStrategies.find(
                (s) => s.name === e.target.value
              );
              setPlayerXStrategy(strategy || null);
            }}
            className="strategy-select"
          >
            <option value="">Select AI Strategy</option>
            <optgroup label="🤖 LLM Models">
              {llmStrategies.map((strategy) => (
                <option key={strategy.name} value={strategy.name}>
                  {strategy.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="⚙️ Traditional AI">
              {traditionalStrategies.map((strategy) => (
                <option key={strategy.name} value={strategy.name}>
                  {strategy.name}
                </option>
              ))}
            </optgroup>
          </select>
          {playerXStrategy && (
            <div className="selected-strategy">
              <strong>Selected:</strong> {playerXStrategy.name}
            </div>
          )}
        </div>

        <div className="game-area">
          <GameBoard
            playerXStrategy={playerXStrategy}
            playerOStrategy={playerOStrategy}
            onGameEnd={handleGameEnd}
          />
        </div>

        <div className="player-selector player-o">
          <h2>Player O</h2>
          <select
            value={playerOStrategy?.name || ""}
            onChange={(e) => {
              const strategy = aiStrategies.find(
                (s) => s.name === e.target.value
              );
              setPlayerOStrategy(strategy || null);
            }}
            className="strategy-select"
          >
            <option value="">Select AI Strategy</option>
            <optgroup label="🤖 LLM Models">
              {llmStrategies.map((strategy) => (
                <option key={strategy.name} value={strategy.name}>
                  {strategy.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="⚙️ Traditional AI">
              {traditionalStrategies.map((strategy) => (
                <option key={strategy.name} value={strategy.name}>
                  {strategy.name}
                </option>
              ))}
            </optgroup>
          </select>
          {playerOStrategy && (
            <div className="selected-strategy">
              <strong>Selected:</strong> {playerOStrategy.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
