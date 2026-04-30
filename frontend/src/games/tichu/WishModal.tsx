import { CardRank, cardRankToString } from "@/games/tichu/domain/Card.ts";
import styles from "./TichuPage.module.css";

const WishModal = ({ onSelect }: { onSelect: (wish: CardRank | null) => void }) => {
  const ranks: CardRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.wishModalContent}>
        <h2>Make a Wish</h2>
        <p>Choose a rank to wish for</p>
        <div className={styles.wishGrid}>
          {ranks.map(r => (
            <button key={r} className={styles.btnWish} onClick={() => onSelect(r)}>
              {cardRankToString(r)}
            </button>
          ))}
          <button className={styles.btnNoWish} onClick={() => onSelect(null)}>
            No Wish
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishModal;
