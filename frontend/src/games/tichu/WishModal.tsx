import { CardRank, cardRankToString } from "@/games/tichu/domain/Card.ts";

const WishModal = ({ onSelect }: { onSelect: (wish: CardRank | null) => void }) => {
  const ranks: CardRank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  return (
    <div className="wish-modal-overlay">
      <div className="wish-modal-content">
        <h2>Make a Wish</h2>
        <p>Choose a rank to wish for</p>
        <div className="wish-grid">
          {ranks.map(r => (
            <button key={r} className="btn-wish" onClick={() => onSelect(r)}>
              {cardRankToString(r)}
            </button>
          ))}
        </div>
        <button className="btn-no-wish" onClick={() => onSelect(null)}>
          No Wish
        </button>
      </div>
    </div>
  );
};

export default WishModal;
