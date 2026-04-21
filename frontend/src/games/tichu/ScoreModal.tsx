import { MouseEventHandler } from "react";
import { Player } from "@/games/tichu/domain/Player.ts";
import { TichuGame } from "@/games/tichu/domain/TichuGame.ts";

const ScoreModal = ({ scoresHistory, players, type, onClose }: {
  scoresHistory: number[][],
  players: Player[],
  type: 'ROUND_END' | 'END',
  onClose: MouseEventHandler<HTMLButtonElement>
}) => {
  const scores = TichuGame.sumScores(scoresHistory);
  const redScore = scores[0];
  const blueScore = scores[1];

  const redPlayers = [players[0], players[2]].map(p => p?.name).join(' & ');
  const bluePlayers = [players[1], players[3]].map(p => p?.name).join(' & ');

  return (
    <div className="score-modal-overlay">
      <div className="score-modal-content">
        <h2>Score Board</h2>
        <div className="score-table-container">
          <table className="score-table">
            <thead>
            <tr>
              <th>Round</th>
              <th>{redPlayers} (RED)</th>
              <th>{bluePlayers} (BLUE)</th>
            </tr>
            </thead>
            <tbody>
            {scoresHistory.map((score, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{score[0]}</td>
                <td>{score[1]}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>Total</td>
              <td>{redScore}</td>
              <td>{blueScore}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <button className="btn-modal-close" onClick={onClose}>
          {type === 'ROUND_END' ? 'Close' : 'Back to Room'}
        </button>
      </div>
    </div>
  );
};

export default ScoreModal;
