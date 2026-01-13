import { useState, useCallback, useEffect } from "react";
import { GameBoard } from "./GameBoard";
import { llmStrategies } from "./aiStrategies";
import type { AIStrategy } from "./aiStrategies";
import type { MatchResult } from "./leagueRunner";

interface LeagueStanding {
  strategy: AIStrategy;
  wins: number;
  draws: number;
  losses: number;
}

interface LeagueMatch {
  playerX: AIStrategy;
  playerO: AIStrategy;
  result: MatchResult | null;
  status: "pending" | "in-progress" | "completed";
}

function App() {
  const [leagueMode, setLeagueMode] = useState(false);
  const [leagueStandings, setLeagueStandings] = useState<LeagueStanding[]>([]);
  const [leagueMatches, setLeagueMatches] = useState<LeagueMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isLeagueRunning, setIsLeagueRunning] = useState(false);
  const [currentDisplayMatch, setCurrentDisplayMatch] = useState<{
    playerX: AIStrategy | null;
    playerO: AIStrategy | null;
    matchIndex: number;
  }>({ playerX: null, playerO: null, matchIndex: -1 });
  const [isShowingFinal, setIsShowingFinal] = useState(false);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
  const [lastMatchResult, setLastMatchResult] = useState<{
    result: MatchResult;
    playerX: string;
    playerO: string;
    isFinal: boolean;
  } | null>(null);
  const [finalMatch, setFinalMatch] = useState<{
    player1: AIStrategy | null;
    player2: AIStrategy | null;
    result: MatchResult | null;
    status: "pending" | "in-progress" | "completed";
  }>({ player1: null, player2: null, result: null, status: "pending" });
  const [leagueWinner, setLeagueWinner] = useState<AIStrategy | null>(null);

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

  // Initialize league with first 4 LLM models
  const initializeLeague = useCallback(() => {
    const leagueModels = llmStrategies.slice(0, 4);

    // Create standings for each model
    const standings: LeagueStanding[] = leagueModels.map((strategy) => ({
      strategy,
      wins: 0,
      draws: 0,
      losses: 0,
    }));

    // Create all 6 matches (round-robin: each model plays each other once)
    const matches: LeagueMatch[] = [];
    for (let i = 0; i < leagueModels.length; i++) {
      for (let j = i + 1; j < leagueModels.length; j++) {
        matches.push({
          playerX: leagueModels[i],
          playerO: leagueModels[j],
          result: null,
          status: "pending",
        });
      }
    }

    setLeagueStandings(standings);
    setLeagueMatches(matches);
    setCurrentMatchIndex(0);
    setCurrentDisplayMatch({ playerX: null, playerO: null, matchIndex: -1 });
    setFinalMatch({
      player1: null,
      player2: null,
      result: null,
      status: "pending",
    });
    setLeagueWinner(null);
    setIsLeagueRunning(false);
    setIsShowingFinal(false);
    setWaitingForConfirmation(false);
    setLastMatchResult(null);
  }, []);

  // Update standings after a match
  const updateStandings = useCallback(
    (playerX: AIStrategy, playerO: AIStrategy, result: MatchResult) => {
      setLeagueStandings((prev) => {
        const newStandings = [...prev];

        const xIndex = newStandings.findIndex(
          (s) => s.strategy.name === playerX.name
        );
        const oIndex = newStandings.findIndex(
          (s) => s.strategy.name === playerO.name
        );

        if (xIndex !== -1) {
          if (result === "X") {
            newStandings[xIndex].wins++;
          } else if (result === "O") {
            newStandings[xIndex].losses++;
          } else {
            newStandings[xIndex].draws++;
          }
        }

        if (oIndex !== -1) {
          if (result === "O") {
            newStandings[oIndex].wins++;
          } else if (result === "X") {
            newStandings[oIndex].losses++;
          } else {
            newStandings[oIndex].draws++;
          }
        }

        return newStandings;
      });
    },
    []
  );

  // Handle match end - show confirmation instead of auto-proceeding
  const handleLeagueMatchEnd = useCallback(
    (result: "X" | "O" | "draw") => {
      if (isShowingFinal) {
        // Final match ended
        const finalResult: MatchResult = result;
        const winner =
          finalResult === "X"
            ? finalMatch.player1
            : finalResult === "O"
            ? finalMatch.player2
            : null;

        setFinalMatch((prev) => ({
          ...prev,
          result: finalResult,
          status: "completed",
        }));

        setLastMatchResult({
          result: finalResult,
          playerX: finalMatch.player1?.name || "",
          playerO: finalMatch.player2?.name || "",
          isFinal: true,
        });
        setWaitingForConfirmation(true);
        setLeagueWinner(winner || finalMatch.player1);
        setIsLeagueRunning(false);
        setIsShowingFinal(false);
        return;
      }

      // Regular league match ended
      const matchIndex = currentDisplayMatch.matchIndex;
      if (matchIndex >= 0 && matchIndex < leagueMatches.length) {
        const match = leagueMatches[matchIndex];
        const matchResult: MatchResult = result;

        setLeagueMatches((prev) => {
          const newMatches = [...prev];
          newMatches[matchIndex].result = matchResult;
          newMatches[matchIndex].status = "completed";
          return newMatches;
        });

        updateStandings(match.playerX, match.playerO, matchResult);

        // Store result and wait for user confirmation
        setLastMatchResult({
          result: matchResult,
          playerX: match.playerX.name,
          playerO: match.playerO.name,
          isFinal: false,
        });
        setWaitingForConfirmation(true);
      }
    },
    [
      currentDisplayMatch,
      leagueMatches,
      finalMatch,
      isShowingFinal,
      updateStandings,
    ]
  );

  // Proceed to next match after user confirmation
  const proceedToNextMatch = useCallback(() => {
    const wasFinal = lastMatchResult?.isFinal || false;
    setWaitingForConfirmation(false);
    setLastMatchResult(null);

    if (wasFinal) {
      // Final match already completed, nothing to do
      return;
    }

    const matchIndex = currentDisplayMatch.matchIndex;
    const nextIndex = matchIndex + 1;

    if (nextIndex < leagueMatches.length) {
      // Move to next match
      setLeagueMatches((prev) => {
        const newMatches = [...prev];
        const nextMatch = newMatches[nextIndex];
        setCurrentMatchIndex(nextIndex + 1);
        setCurrentDisplayMatch({
          playerX: nextMatch.playerX,
          playerO: nextMatch.playerO,
          matchIndex: nextIndex,
        });
        newMatches[nextIndex].status = "in-progress";
        return newMatches;
      });
    } else {
      // All matches completed, calculate standings and show final
      setCurrentDisplayMatch({
        playerX: null,
        playerO: null,
        matchIndex: -1,
      });

      // Calculate standings from all completed matches
      setLeagueMatches((prev) => {
        const leagueModels = llmStrategies.slice(0, 4);
        const standingsMap = new Map<
          string,
          { wins: number; draws: number; losses: number }
        >();

        leagueModels.forEach((model) => {
          standingsMap.set(model.name, { wins: 0, draws: 0, losses: 0 });
        });

        prev.forEach((m) => {
          if (m.result) {
            const xStats = standingsMap.get(m.playerX.name)!;
            const oStats = standingsMap.get(m.playerO.name)!;

            if (m.result === "X") {
              xStats.wins++;
              oStats.losses++;
            } else if (m.result === "O") {
              oStats.wins++;
              xStats.losses++;
            } else {
              xStats.draws++;
              oStats.draws++;
            }
          }
        });

        // Convert to sorted array
        const sortedStandings = leagueModels
          .map((strategy) => ({
            strategy,
            ...standingsMap.get(strategy.name)!,
          }))
          .sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.draws - a.draws;
          });

        setLeagueStandings(sortedStandings);

        const top2 = sortedStandings.slice(0, 2);
        if (top2.length === 2) {
          // Start final match
          setFinalMatch({
            player1: top2[0].strategy,
            player2: top2[1].strategy,
            result: null,
            status: "in-progress",
          });
          setIsShowingFinal(true);
          setCurrentDisplayMatch({
            playerX: top2[0].strategy,
            playerO: top2[1].strategy,
            matchIndex: -1,
          });
        } else {
          setIsLeagueRunning(false);
        }

        return prev;
      });
    }
  }, [currentDisplayMatch, leagueMatches, isShowingFinal]);

  // Start league
  const runLeague = useCallback(() => {
    if (leagueMatches.length === 0) {
      initializeLeague();
      return;
    }

    setIsLeagueRunning(true);
    setCurrentMatchIndex(1);

    // Start first match
    const firstMatch = leagueMatches[0];
    setCurrentDisplayMatch({
      playerX: firstMatch.playerX,
      playerO: firstMatch.playerO,
      matchIndex: 0,
    });
    setLeagueMatches((prev) => {
      const newMatches = [...prev];
      newMatches[0].status = "in-progress";
      return newMatches;
    });
  }, [leagueMatches, initializeLeague]);

  // Initialize league when league mode is enabled
  useEffect(() => {
    if (leagueMode && leagueMatches.length === 0) {
      initializeLeague();
    }
  }, [leagueMode, leagueMatches.length, initializeLeague]);

  return (
    <div className="app">
      <header className="header">
        <h1>🎮 AI vs AI Tic-Tac-Toe League</h1>
        <div className="mode-toggle">
          <button
            onClick={() => setLeagueMode(!leagueMode)}
            className={`mode-button ${leagueMode ? "active" : ""}`}
          >
            {leagueMode ? "🏆 League Mode" : "🎯 Manual Mode"}
          </button>
        </div>
        {!leagueMode && (
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
        )}
      </header>

      {leagueMode ? (
        <div className="league-container">
          <div className="league-controls">
            <button
              onClick={runLeague}
              disabled={isLeagueRunning}
              className="league-button"
            >
              {isLeagueRunning ? "🏃 Running League..." : "🚀 Start League"}
            </button>
            <button
              onClick={initializeLeague}
              disabled={isLeagueRunning}
              className="league-button secondary"
            >
              🔄 Reset League
            </button>
          </div>

          {/* Current Match Display */}
          {isLeagueRunning &&
            currentDisplayMatch.playerX &&
            currentDisplayMatch.playerO && (
              <div className="current-match-display">
                <div className="current-match-header">
                  <h3>
                    {isShowingFinal
                      ? "🥇 Final Match"
                      : `Match ${currentMatchIndex} of ${leagueMatches.length}`}
                  </h3>
                  <div className="current-match-players">
                    <div className="current-player">
                      <span className="player-label">Player X:</span>
                      <span className="player-name">
                        {currentDisplayMatch.playerX.name}
                      </span>
                    </div>
                    <div className="vs-divider">vs</div>
                    <div className="current-player">
                      <span className="player-label">Player O:</span>
                      <span className="player-name">
                        {currentDisplayMatch.playerO.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="current-match-board">
                  <GameBoard
                    key={`match-${currentDisplayMatch.matchIndex}-${
                      isShowingFinal ? "final" : "league"
                    }`}
                    playerXStrategy={currentDisplayMatch.playerX}
                    playerOStrategy={currentDisplayMatch.playerO}
                    onGameEnd={handleLeagueMatchEnd}
                  />
                </div>
              </div>
            )}

          {/* Match End Confirmation */}
          {waitingForConfirmation && lastMatchResult && (
            <div className="match-confirmation">
              <div className="confirmation-content">
                <h3>🎉 Match Completed!</h3>
                <div className="match-result-display">
                  <div className="result-info">
                    <div className="result-player">
                      <span className="player-name">
                        {lastMatchResult.playerX}
                      </span>
                      <span className="player-role">(Player X)</span>
                    </div>
                    <div className="result-vs">vs</div>
                    <div className="result-player">
                      <span className="player-name">
                        {lastMatchResult.playerO}
                      </span>
                      <span className="player-role">(Player O)</span>
                    </div>
                  </div>
                  <div className="result-winner">
                    {lastMatchResult.result === "draw" ? (
                      <span className="draw-result">🤝 It's a Draw!</span>
                    ) : lastMatchResult.result === "X" ? (
                      <span className="winner-result">
                        🏆 Winner: {lastMatchResult.playerX}
                      </span>
                    ) : (
                      <span className="winner-result">
                        🏆 Winner: {lastMatchResult.playerO}
                      </span>
                    )}
                  </div>
                </div>
                <div className="confirmation-buttons">
                  <button
                    onClick={proceedToNextMatch}
                    className="confirm-button"
                  >
                    {lastMatchResult.isFinal ||
                    (currentDisplayMatch.matchIndex >= 0 &&
                      currentDisplayMatch.matchIndex + 1 >=
                        leagueMatches.length)
                      ? "✅ View Results"
                      : "➡️ Continue to Next Match"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {leagueWinner && (
            <div className="league-winner">
              <h2>🏆 League Champion 🏆</h2>
              <div className="winner-name">{leagueWinner.name}</div>
            </div>
          )}

          {finalMatch.status !== "pending" && (
            <div className="final-match">
              <h3>🥇 Final Match</h3>
              <div className="final-players">
                <div className="final-player">
                  {finalMatch.player1?.name || "TBD"}
                </div>
                <div className="vs">vs</div>
                <div className="final-player">
                  {finalMatch.player2?.name || "TBD"}
                </div>
              </div>
              {finalMatch.result && (
                <div className="final-result">
                  Result:{" "}
                  {finalMatch.result === "draw"
                    ? "Draw"
                    : finalMatch.result === "X"
                    ? `${finalMatch.player1?.name} Wins!`
                    : `${finalMatch.player2?.name} Wins!`}
                </div>
              )}
            </div>
          )}

          {leagueStandings.length > 0 && (
            <div className="league-standings">
              <h3>📊 League Standings</h3>
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Model</th>
                    <th>Wins</th>
                    <th>Draws</th>
                    <th>Losses</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {[...leagueStandings]
                    .sort((a, b) => {
                      if (b.wins !== a.wins) return b.wins - a.wins;
                      return b.draws - a.draws;
                    })
                    .map((standing, index) => (
                      <tr key={standing.strategy.name}>
                        <td>{index + 1}</td>
                        <td>{standing.strategy.name}</td>
                        <td>{standing.wins}</td>
                        <td>{standing.draws}</td>
                        <td>{standing.losses}</td>
                        <td>{standing.wins * 3 + standing.draws}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {leagueMatches.length > 0 && (
            <div className="league-matches">
              <h3>
                🎮 League Matches ({currentMatchIndex}/{leagueMatches.length})
              </h3>
              <div className="matches-list">
                {leagueMatches.map((match, index) => (
                  <div
                    key={index}
                    className={`match-item ${
                      match.status === "completed"
                        ? "completed"
                        : match.status === "in-progress"
                        ? "in-progress"
                        : "pending"
                    }`}
                  >
                    <div className="match-players">
                      <span>{match.playerX.name}</span>
                      <span className="vs">vs</span>
                      <span>{match.playerO.name}</span>
                    </div>
                    <div className="match-status">
                      {match.status === "completed" && match.result ? (
                        <span>
                          {match.result === "draw"
                            ? "Draw"
                            : match.result === "X"
                            ? `${match.playerX.name} Wins`
                            : `${match.playerO.name} Wins`}
                        </span>
                      ) : match.status === "in-progress" ? (
                        <span>⚡ Playing...</span>
                      ) : (
                        <span>⏳ Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="main-container">
          <div className="player-selector player-x">
            <h2>Player X</h2>
            <select
              value={playerXStrategy?.name || ""}
              onChange={(e) => {
                const strategy = llmStrategies.find(
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
                const strategy = llmStrategies.find(
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
            </select>
            {playerOStrategy && (
              <div className="selected-strategy">
                <strong>Selected:</strong> {playerOStrategy.name}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
