import { Card, cardRankToString, CardSuit, CardType } from "@/games/tichu/domain/Card.ts";
import React, { MouseEventHandler } from "react";
import sparrowImg from "@/assets/tichu/sparrow.png";
import phoenixImg from "@/assets/tichu/phoenix.png";
import dragonImg from "@/assets/tichu/dragon.png";
import dogImg from "@/assets/tichu/dog.png";

const cardSuitToIcon = (suit: CardSuit | undefined) => {
  switch (suit) {
    case CardSuit.SPADE:
      return '♠';
    case CardSuit.HEART:
      return '♥';
    case CardSuit.DIAMOND:
      return '♦';
    case CardSuit.CLUB:
      return '♣';
    default:
      return '';
  }
};

export const CardView = ({ card, isSelectable = false, isSelected = false, onClick = undefined }: {
  card: Card,
  isSelectable?: boolean,
  isSelected?: boolean,
  onClick?: MouseEventHandler<HTMLDivElement> | undefined,
}) => {
  const isSpecial = card.type !== CardType.STANDARD;
  const suitIcon = cardSuitToIcon(card.suit);
  const rankLabel = card.rank === undefined ? null : cardRankToString(card.rank);

  let centerContent: React.JSX.Element;
  if (isSpecial) {
    let imgSrc: string | null = null;
    switch (card.type) {
      case CardType.SPARROW:
        imgSrc = sparrowImg;
        break;
      case CardType.PHOENIX:
        imgSrc = phoenixImg;
        break;
      case CardType.DRAGON:
        imgSrc = dragonImg;
        break;
      case CardType.DOG:
        imgSrc = dogImg;
        break;
      default:
        break;
    }
    if (imgSrc) {
      centerContent = <img src={imgSrc} alt={card.type} className="card-image"/>;
    } else {
      centerContent = <span className="special-label">{card.type}</span>;
    }
  } else {
    centerContent = <span className="card-center-icon">{suitIcon}</span>;
  }

  return (
    <div
      key={`${card.type}-${card.suit}-${card.rank}`}
      className={`card suit-${card.suit} ${isSelectable ? 'selectable' : ''} ${isSelected ? 'selected' : ''} ${isSpecial ? 'special-card' : ''}`}
      onClick={onClick}
    >
      <div className="card-top">
        {rankLabel && <span className="card-rank">{rankLabel}</span>}
        {suitIcon && <span className="card-suit">{suitIcon}</span>}
        {isSpecial && <span className="special-tiny-label">{card.type}</span>}
      </div>
      <div className="card-center">
        {centerContent}
      </div>
      <div className="card-bottom">
        {rankLabel && <span className="card-rank">{rankLabel}</span>}
        {suitIcon && <span className="card-suit">{suitIcon}</span>}
        {isSpecial && <span className="special-tiny-label">{card.type}</span>}
      </div>
    </div>
  );
}