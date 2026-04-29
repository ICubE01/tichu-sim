import React, { MouseEventHandler } from "react";
import { Card, cardRankToString, CardSuit, CardType, StandardCard } from "@/games/tichu/domain/Card.ts";
import sparrowImg from "@/assets/tichu/sparrow.png";
import phoenixImg from "@/assets/tichu/phoenix.png";
import dragonImg from "@/assets/tichu/dragon.png";
import dogImg from "@/assets/tichu/dog.png";
import styles from "./TichuPage.module.css";

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

const CardView = ({ card, isSelectable = false, isSelected = false, onClick = undefined }: {
  card: Card,
  isSelectable?: boolean,
  isSelected?: boolean,
  onClick?: MouseEventHandler<HTMLDivElement> | undefined,
}) => {
  const isSpecial = card.type !== CardType.STANDARD;
  const suitIcon = cardSuitToIcon(card instanceof StandardCard ? card.suit : undefined);
  const rankLabel = card instanceof StandardCard ? cardRankToString(card.rank) : null;

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
      centerContent = <img src={imgSrc} alt={card.type} className={styles.cardImage}/>;
    } else {
      centerContent = <span className={styles.specialLabel}>{card.type}</span>;
    }
  } else {
    centerContent = <span className={styles.cardCenterIcon}>{suitIcon}</span>;
  }

  let suitCss = ''
  if (card instanceof StandardCard) {
    switch (card.suit) {
      case CardSuit.SPADE:
        suitCss = styles.suitSpade;
        break;
      case CardSuit.CLUB:
        suitCss = styles.suitClub;
        break;
      case CardSuit.HEART:
        suitCss = styles.suitHeart;
        break;
      case CardSuit.DIAMOND:
        suitCss = styles.suitDiamond;
        break;
    }
  }

  return (
    <div
      key={`${card.type}-${card instanceof StandardCard ? (card.suit + '-' + card.rank) : ''}`}
      className={`${styles.card} ${suitCss} ${isSelectable ? styles.selectable : ''} ${isSelected ? styles.selected : ''} ${isSpecial ? styles.specialCard : ''}`}
      onClick={onClick}
    >
      <div className={styles.cardTop}>
        {rankLabel && <span className={styles.cardRank}>{rankLabel}</span>}
        {suitIcon && <span className={styles.cardSuit}>{suitIcon}</span>}
        {isSpecial && <span className={styles.specialTinyLabel}>{card.type}</span>}
      </div>
      <div className={styles.cardCenter}>
        {centerContent}
      </div>
      <div className={styles.cardBottom}>
        {rankLabel && <span className={styles.cardRank}>{rankLabel}</span>}
        {suitIcon && <span className={styles.cardSuit}>{suitIcon}</span>}
        {isSpecial && <span className={styles.specialTinyLabel}>{card.type}</span>}
      </div>
    </div>
  );
}

export default CardView;
