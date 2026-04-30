import { MouseEventHandler } from "react";
import { PlayerIndex } from "@/games/tichu/types.ts";
import { Player } from "@/games/tichu/domain/Player.ts";
import { ExchangeMessage } from "@/games/tichu/dtos/ExchangeMessage.ts";
import { CardMapper } from "@/games/tichu/mappers/CardMapper.ts";
import CardView from "@/games/tichu/CardView.tsx";
import styles from "./TichuPage.module.css";

const ExchangeResultModal = ({ result, players, myIndex, onClose }: {
  result: ExchangeMessage,
  players: Player[],
  myIndex: PlayerIndex,
  onClose: MouseEventHandler<HTMLButtonElement> | undefined
}) => {
  const exchanges = [
    { label: 'Left', index: (myIndex + 3) % 4, gave: result.gaveToLeft, received: result.receivedFromLeft },
    { label: 'Partner', index: (myIndex + 2) % 4, gave: result.gaveToMid, received: result.receivedFromMid },
    { label: 'Right', index: (myIndex + 1) % 4, gave: result.gaveToRight, received: result.receivedFromRight },
  ];

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.exchangeModalContent}>
        <h2>Exchange Results</h2>
        <div className={styles.exchangeResultsContainer}>
          <div className={styles.exchangeSection}>
            <h3>You Gave</h3>
            <div className={styles.exchangeGrid}>
              {exchanges.map((ex, i) => (
                <div key={`gave-${i}`} className={styles.exchangeItem}>
                  <div className={styles.targetPlayerName}>{players[ex.index]?.name || ex.label}</div>
                  {ex.gave ?
                    <CardView card={CardMapper.toCard(ex.gave)}/> :
                    <div className={`${styles.card} ${styles.cardPlaceholder}`}>?</div>}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.exchangeSection}>
            <h3>You Received</h3>
            <div className={styles.exchangeGrid}>
              {exchanges.map((ex, i) => (
                <div key={`received-${i}`} className={styles.exchangeItem}>
                  <div className={styles.targetPlayerName}>{players[ex.index]?.name || ex.label}</div>
                  {ex.received ?
                    <CardView card={CardMapper.toCard(ex.received)}/> :
                    <div className={`${styles.card} ${styles.cardPlaceholder}`}>?</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <button className={styles.btnModalClose} onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default ExchangeResultModal;
