import { MouseEventHandler } from "react";
import { Player } from "@/games/tichu/domain/Player.ts";
import { TichuGame } from "@/games/tichu/domain/TichuGame.ts";
import styles from "./TichuPage.module.css";

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
    <div className={styles.modalOverlay}>
      <div className={styles.scoreModalContent}>
        <h2>Score Board</h2>
        <div className={styles.scoreTableContainer}>
          <table className={styles.scoreTable}>
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
            <tr className={styles.totalRow}>
              <td>Total</td>
              <td>{redScore}</td>
              <td>{blueScore}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <button className={styles.btnModalClose} onClick={onClose}>
          {type === 'ROUND_END' ? 'Close' : 'Back to Room'}
        </button>
      </div>
    </div>
  );
};

export default ScoreModal;
