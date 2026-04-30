import { KeyboardEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from "@/useAuth.tsx";
import { useStomp } from "@/useStomp.tsx";
import { ChatMessage } from "@/types.ts";
import { PlayerIndex } from "@/games/tichu/types.ts";
import {
  Card,
  CardRank,
  cardRankToString,
  CardSuit,
  CardType,
  DogCard,
  DragonCard,
  PhoenixCard,
  SparrowCard,
  StandardCard
} from "@/games/tichu/domain/Card.ts";
import { Cards } from "@/games/tichu/domain/Cards.ts";
import { Player } from "@/games/tichu/domain/Player.ts";
import { Team } from "@/games/tichu/domain/Team.ts";
import { TichuDeclaration } from "@/games/tichu/domain/TichuDeclaration.ts";
import { PhaseStatus, RoundStatus, TichuGame } from "@/games/tichu/domain/TichuGame.ts";
import { TichuWinningScore } from "@/games/tichu/domain/TichuRule.ts";
import {
  ConsecutivePairsTrick,
  FourOfAKindTrick,
  FullHouseTrick,
  isBomb,
  PairTrick,
  SingleTrick,
  StraightFlushTrick,
  StraightTrick,
  ThreeOfAKindTrick,
  Trick,
  TrickBuilder,
  TrickType
} from "@/games/tichu/domain/Trick.ts";
import { CardDto } from "@/games/tichu/dtos/CardDto.ts";
import { ExchangeMessage } from "@/games/tichu/dtos/ExchangeMessage.ts";
import { PlayBombMessage } from "@/games/tichu/dtos/PlayBombMessage.ts";
import { PlayTrickMessage } from "@/games/tichu/dtos/PlayTrickMessage.ts";
import { PlayerDto, TichuDto } from "@/games/tichu/dtos/TichuDto.ts";
import { TichuMessage, TichuMessageType } from "@/games/tichu/dtos/TichuMessage.ts";
import { CardMapper } from "@/games/tichu/mappers/CardMapper.ts";
import { TrickMapper } from "@/games/tichu/mappers/TrickMapper.ts";
import CardView from "@/games/tichu/CardView.tsx";
import ExchangeResultModal from "@/games/tichu/ExchangeResultModal.tsx";
import WishModal from "@/games/tichu/WishModal.tsx";
import ScoreModal from "@/games/tichu/ScoreModal.tsx";
import styles from './TichuPage.module.css';

enum PlayerPosition {
  LEFT = 'left',
  MID = 'mid',
  RIGHT = 'right',
}

const playerPositionToOffset = (position: PlayerPosition) => {
  switch (position) {
    case PlayerPosition.LEFT:
      return 3;
    case PlayerPosition.MID:
      return 2;
    case PlayerPosition.RIGHT:
      return 1;
  }
}

class ExchangeSelection {
  left: Card | null;
  mid: Card | null;
  right: Card | null;

  constructor() {
    this.left = null;
    this.mid = null;
    this.right = null;
  }
}

const TichuPage = ({ roomId, stomp, chatMessages, onGameEnd }: {
  roomId: string,
  stomp: useStomp,
  chatMessages: ChatMessage[],
  onGameEnd: Function
}) => {
  const { user } = useAuth();
  if (user === null) {
    return null;
  }

  const [game, setGame] = useState<TichuGame>(new TichuGame());
  const messageQueue = useRef<TichuMessage[]>([]);
  const isPaused = useRef(false);
  const handleTichuMessageRef = useRef<((message: TichuMessage) => void)>((_) => {});

  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [exchangeSelection, setExchangeSelection] = useState<ExchangeSelection>(new ExchangeSelection());

  const [scoreModalType, setScoreModalType] = useState<null | 'ROUND_END' | 'END'>(null);
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [exchangeResult, setExchangeResult] = useState<ExchangeMessage | null>(null);
  const [isRulePopupOpen, setIsRulePopupOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Resume processing when delay ends
  const processQueue = useCallback(() => {
    while (messageQueue.current.length > 0 && !isPaused.current) {
      const msg = messageQueue.current.shift();
      if (msg === undefined) {
        continue;
      }
      if (handleTichuMessageRef.current) {
        handleTichuMessageRef.current(msg);
      }
      // If handleTichuMessage triggered another pause, stop processing
      if (isPaused.current) break;
    }
  }, []); // No dependencies needed as it uses Refs

  const handleTichuMessage = useCallback((message: TichuMessage) => {
    switch (message.type) {
      case TichuMessageType.START:
        const playerDtos = message.data as PlayerDto[];
        setGame(prev => ({
          ...prev,
          players: playerDtos.slice(0, 4).map((p, i) =>
            new Player(p.id, p.name, p.team, i as PlayerIndex)
          ),
        }));
        break;
      case TichuMessageType.GET:
        const tichuDto = message.data as TichuDto;
        const calcPassed = (index: PlayerIndex, tichuDto: TichuDto) => {
          if (
            tichuDto.roundStatus !== RoundStatus.PLAYING || tichuDto.turn === null // No tricks played
            || tichuDto.tricks === null || tichuDto.tricks.length === 0 // No tricks played
            || tichuDto.exitOrder[index] !== 0 // Already exited
            || index === tichuDto.turn // Turn is mine
          ) {
            return false;
          }
          if (tichuDto.phaseStatus === PhaseStatus.WAITING_DRAGON_SELECTION) { // Phase ended with dragon
            return true;
          }
          const lastTrickDto = tichuDto.tricks[tichuDto.tricks.length - 1];
          if (lastTrickDto.playerIndex < tichuDto.turn) {
            return lastTrickDto.playerIndex < index && index < tichuDto.turn;
          } else {
            return index < tichuDto.turn || lastTrickDto.playerIndex < index;
          }
        }
        let newExchangeSelection: ExchangeSelection;
        if (tichuDto.myExchange !== null) {
          newExchangeSelection = {
            left: CardMapper.toCardNullable(tichuDto.myExchange.left),
            mid: CardMapper.toCardNullable(tichuDto.myExchange.mid),
            right: CardMapper.toCardNullable(tichuDto.myExchange.right),
          };
        } else {
          newExchangeSelection = new ExchangeSelection();
        }
        setExchangeSelection(newExchangeSelection)
        setGame({
          rule: tichuDto.rule,
          players: tichuDto.players.slice(0, 4).map((p, i) =>
            new Player(
              p.id,
              p.name,
              p.team,
              i as PlayerIndex,
              tichuDto.handCounts[p.id],
              tichuDto.tichuDeclarations[i],
              tichuDto.exitOrder[i],
              calcPassed(i as PlayerIndex, tichuDto),
            )
          ),
          scoresHistory: tichuDto.scoresHistory,
          hand: tichuDto.myHand.map(CardMapper.toCard).filter(card =>
            !card.equals(newExchangeSelection.left)
            && !card.equals(newExchangeSelection.mid)
            && !card.equals(newExchangeSelection.right)
          ),
          roundStatus: tichuDto.roundStatus,
          wish: tichuDto.wish,
          phaseStatus: tichuDto.phaseStatus,
          turn: tichuDto.turn,
          tricks: tichuDto.tricks === null ? [] : tichuDto.tricks.map(TrickMapper.toTrick),
        });
        break;
      case TichuMessageType.INIT_FIRST_DRAWS:
        const firstDraw = message.data as CardDto[];
        setSelectedCards([]);
        setGame(prev => ({
          ...prev,
          hand: firstDraw.map(CardMapper.toCard),
          players: prev.players.map(p => ({
            ...p,
            cardCount: 8,
            tichuDeclaration: null,
            exitOrder: 0,
            passed: false,
          })),
          roundStatus: RoundStatus.WAITING_LARGE_TICHU,
          wish: null,
          phaseStatus: null,
          turn: null,
          tricks: [],
        }));
        break;
      case TichuMessageType.LARGE_TICHU:
        const tichuDecl = message.data as TichuDeclaration[];
        setGame(prev => ({
          ...prev,
          players: prev.players.map((p, i) => ({ ...p, tichuDeclaration: tichuDecl[i] })),
        }));
        break;
      case TichuMessageType.ADD_SECOND_DRAWS:
        const hand = message.data as CardDto[];
        setGame(prev => ({
          ...prev,
          hand: hand.map(CardMapper.toCard),
          players: prev.players.map(p => ({ ...p, cardCount: 14 })),
          roundStatus: RoundStatus.EXCHANGING,
        }));
        break;
      case TichuMessageType.SMALL_TICHU:
        const playerId = message.data as number;
        setGame(prev => ({
          ...prev,
          players: prev.players.map(p => {
            if (p.id === playerId) {
              return { ...p, tichuDeclaration: TichuDeclaration.SMALL };
            } else {
              return p;
            }
          }),
        }));
        break;
      case TichuMessageType.EXCHANGE:
        const exchangeMessage = message.data as ExchangeMessage;
        setExchangeSelection(new ExchangeSelection());
        setExchangeResult(exchangeMessage);
        setIsExchangeModalOpen(true);
        setGame(prev => {
          const cardsGave = [
            exchangeMessage.gaveToLeft,
            exchangeMessage.gaveToMid,
            exchangeMessage.gaveToRight
          ].map(CardMapper.toCard);
          const cardsReceived = [
            exchangeMessage.receivedFromLeft,
            exchangeMessage.receivedFromMid,
            exchangeMessage.receivedFromRight
          ].map(CardMapper.toCard);
          const newHand = prev.hand
            .filter(c => !cardsGave.some(cg => cg.equals(c)))
            .concat(cardsReceived);
          return ({
            ...prev,
            hand: newHand,
            roundStatus: RoundStatus.PLAYING,
          });
        });
        break;
      case TichuMessageType.PHASE_START:
        const firstPlayerIndex = message.data as PlayerIndex;
        setGame(prev => ({
          ...prev,
          players: prev.players.map(p => ({ ...p, passed: false })),
          phaseStatus: PhaseStatus.PLAYING,
          turn: firstPlayerIndex,
          tricks: [],
        }));
        break;
      case TichuMessageType.PLAY_TRICK:
        const playTrickMessage = message.data as PlayTrickMessage;
        const trick = TrickMapper.toTrick(playTrickMessage.trick);
        setGame(prev => {
          const newHand = user.id === playTrickMessage.playerId
            ? prev.hand.filter(c => !trick.cards.some(tc => tc.equals(c)))
            : prev.hand;
          const newWish = playTrickMessage.wish !== null
            ? playTrickMessage.wish
            : (prev.wish !== null
              ? (Cards.extractStandardCards(trick.cards).map(card => card.rank).includes(prev.wish)
                ? null
                : prev.wish)
              : null);
          if (prev.turn === null) {
            return prev;
          }
          let newTurn = (prev.turn + 1) % 4 as PlayerIndex;
          while (prev.players[newTurn].exitOrder !== 0) {
            newTurn = (newTurn + 1) % 4;
          }
          return {
            ...prev,
            players: prev.players.map(p => {
              if (p.id === playTrickMessage.playerId) {
                const newCardCount = p.cardCount - playTrickMessage.trick.cards.length;
                const newExitOrder = newCardCount === 0
                  ? Math.max(...prev.players.map(p => p.exitOrder)) + 1
                  : 0;
                return ({
                  ...p,
                  cardCount: newCardCount,
                  exitOrder: newExitOrder,
                  passed: false,
                });
              } else {
                return ({ ...p, passed: false });
              }
            }),
            hand: newHand,
            wish: newWish,
            turn: newTurn,
            tricks: [...prev.tricks, trick],
          };
        });
        if (playTrickMessage.trick.type === TrickType.DOG) {
          isPaused.current = true;
          setTimeout(() => {
            isPaused.current = false;
            processQueue();
          }, 1000);
        }
        break;
      case TichuMessageType.PLAY_BOMB:
        const playBombMessage = message.data as PlayBombMessage;
        const bomb = TrickMapper.toTrick(playBombMessage.bomb);
        setGame(prev => {
          const newHand = user.id === playBombMessage.playerId
            ? prev.hand.filter(c => !bomb.cards.some(bc => bc.equals(c)))
            : prev.hand;
          const newWish = prev.wish !== null
            ? (Cards.extractStandardCards(bomb.cards).map(card => card.rank).includes(prev.wish)
              ? null
              : prev.wish)
            : null;
          let newTurn = (prev.players.findIndex(p => p.id === playBombMessage.playerId) + 1) % 4 as PlayerIndex;
          while (prev.players[newTurn].exitOrder !== 0) {
            newTurn = (newTurn + 1) % 4;
          }
          return {
            ...prev,
            players: prev.players.map(p => {
              if (p.id === playBombMessage.playerId) {
                const newCardCount = p.cardCount - playBombMessage.bomb.cards.length;
                const newExitOrder = newCardCount === 0
                  ? Math.max(...prev.players.map(p => p.exitOrder)) + 1
                  : 0;
                return ({
                  ...p,
                  cardCount: newCardCount,
                  exitOrder: newExitOrder,
                  passed: false,
                });
              } else {
                return ({ ...p, passed: false });
              }
            }),
            hand: newHand,
            wish: newWish,
            turn: newTurn,
            tricks: [...prev.tricks, bomb],
          };
        });
        break;
      case TichuMessageType.PASS:
        const playerId2 = message.data as number;
        setGame(prev => {
          if (prev.turn === null) {
            return prev;
          }
          let newTurn: PlayerIndex = (prev.turn + 1) % 4 as PlayerIndex;
          while (prev.players[newTurn].exitOrder !== 0) {
            newTurn = (newTurn + 1) % 4;
          }
          return ({
            ...prev,
            players: prev.players.map(p => p.id === playerId2 ? { ...p, passed: true } : p),
            turn: newTurn,
          });
        });
        break;
      case TichuMessageType.PHASE_END_WITH_DRAGON:
        const playerIndex = message.data as PlayerIndex;
        setGame(prev => ({
          ...prev,
          phaseStatus: PhaseStatus.WAITING_DRAGON_SELECTION,
          turn: playerIndex,
        }));
        break;
      case TichuMessageType.SELECT_DRAGON_RECEIVER:
        break;
      case TichuMessageType.ROUND_END:
        const scoresHistory = message.data as number[][];
        setGame(prev => ({
          ...prev,
          scoresHistory: scoresHistory,
        }));
        isPaused.current = true;
        setTimeout(() => {
          setScoreModalType('ROUND_END');
          isPaused.current = false;
          processQueue();
        }, 1000);
        break;
      case TichuMessageType.END:
        const scoresHistory2 = message.data as number[][];
        setGame(prev => ({
          ...prev,
          scoresHistory: scoresHistory2,
        }));
        isPaused.current = true;
        setTimeout(() => {
          setScoreModalType('END');
          isPaused.current = false;
          processQueue();
        }, 1000);
        break;
      default:
        break;
    }
  }, [user.id, processQueue]);

  useEffect(() => {
    handleTichuMessageRef.current = handleTichuMessage;
  }, [handleTichuMessage]);


  useEffect(() => {
    const processTichuMessage = (message: TichuMessage) => {
      if (isPaused.current) {
        messageQueue.current.push(message);
      } else {
        handleTichuMessage(message);
      }
    };

    const destination = `/user/${user.id}/queue/game/tichu`;
    stomp.subscribe(destination, processTichuMessage);
    stomp.publish(`/app/rooms/${roomId}/game/tichu/get`, {});
    return () => stomp.unsubscribe(destination, processTichuMessage);
  }, [roomId, handleTichuMessage, user, processQueue]);

  const playerMe = game.players.find(p => p.id === user.id);
  const myIndex = playerMe?.index;
  const lastTrick = game.tricks.length === 0 ? null : game.tricks[game.tricks.length - 1];
  const myTrick = myIndex !== undefined ? TrickBuilder.of(myIndex, selectedCards, lastTrick).build() : null;
  const scores = TichuGame.sumScores(game.scoresHistory);

  const canDeclareLargeTichu =
    game.roundStatus === RoundStatus.WAITING_LARGE_TICHU
    && playerMe !== undefined && playerMe.tichuDeclaration === null;

  const canDeclareSmallTichu =
    (game.roundStatus === RoundStatus.EXCHANGING || game.roundStatus === RoundStatus.PLAYING && game.hand.length === 14)
    && playerMe !== undefined && playerMe.tichuDeclaration === TichuDeclaration.NONE;

  const isExchanging = game.roundStatus === RoundStatus.EXCHANGING;

  const canPlayTrick = game.phaseStatus === PhaseStatus.PLAYING && myTrick !== null
    && myTrick.canCoverUp(lastTrick) && !isBomb(myTrick.type) && game.turn === myIndex;

  const canPlayBomb = game.phaseStatus === PhaseStatus.PLAYING && myTrick !== null
    && myTrick.canCoverUp(lastTrick) && isBomb(myTrick.type) && (game.turn === myIndex || lastTrick !== null);

  const canPass = game.phaseStatus === PhaseStatus.PLAYING && game.turn === myIndex && lastTrick !== null;

  const haveToSelectDragonReceiver =
    game.phaseStatus === PhaseStatus.WAITING_DRAGON_SELECTION && game.turn === myIndex;

  const getPlayerAtPosition = (position: PlayerPosition) => {
    if (myIndex === undefined) {
      return undefined;
    }
    const offset = playerPositionToOffset(position);
    const index = (myIndex + offset) % 4 as PlayerIndex;
    return game.players[index];
  }

  const toggleCardSelection = (card: Card) => {
    setSelectedCards(prev => {
      if (prev.some(c => c.equals(card))) {
        return prev.filter(c => !c.equals(card));
      } else {
        return [...prev, card];
      }
    });
  };

  const decideLargeTichuDeclaration = (isLargeTichuDeclared: boolean) => {
    if (!canDeclareLargeTichu) {
      return;
    }
    stomp.publish(`/app/rooms/${roomId}/game/tichu/large-tichu`, { isLargeTichuDeclared });
  }

  const declareSmallTichu = () => {
    if (!canDeclareSmallTichu) {
      return;
    }
    stomp.publish(`/app/rooms/${roomId}/game/tichu/small-tichu`, {});
  };

  const exchange = (position: PlayerPosition) => {
    if (!isExchanging || selectedCards.length !== 1) {
      return;
    }

    const card = selectedCards[0];
    const newSelection = { ...exchangeSelection, [position]: card };
    setExchangeSelection(newSelection);
    stomp.publish(`/app/rooms/${roomId}/game/tichu/exchange`, {
      left: CardMapper.toDtoNullable(newSelection.left),
      mid: CardMapper.toDtoNullable(newSelection.mid),
      right: CardMapper.toDtoNullable(newSelection.right),
    });

    setSelectedCards([]);
    setGame(prev => ({
      ...prev,
      hand: prev.hand.filter(c => !card.equals(c))
    }));
  };

  const playTrick = () => {
    if (!canPlayTrick) {
      return;
    }
    if (game.wish) {
      const canSatisfyWish = Cards.containsWishCard(game.hand, game.wish)
        && (lastTrick === null || lastTrick.canFulfillWishAfter(game.wish, game.hand));
      const satisfiesNow = Cards.extractStandardCards(selectedCards).some(card => card.rank === game.wish);

      if (canSatisfyWish && !satisfiesNow) {
        alert(`You must satisfy the wish (${cardRankToString(game.wish)}) if you can!`);
        return;
      }
    }

    const hasSparrow = Cards.containsSparrow(selectedCards);
    if (hasSparrow) {
      setIsWishModalOpen(true);
    } else {
      playTrickInternal(null);
    }
  };

  const playTrickInternal = (wish: CardRank | null) => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/play-trick`, {
      cards: selectedCards.map(CardMapper.toDto),
      wish: wish,
    });
    setSelectedCards([]);
  };

  const playBomb = () => {
    if (!canPlayBomb) {
      return;
    }
    stomp.publish(`/app/rooms/${roomId}/game/tichu/play-bomb`, {
      cards: selectedCards.map(CardMapper.toDto),
    });
    setSelectedCards([]);
  };

  const pass = () => {
    if (game.wish) {
      if (Cards.containsWishCard(game.hand, game.wish)
        && (lastTrick === null || lastTrick.canFulfillWishAfter(game.wish, game.hand))
      ) {
        alert(`You must satisfy the wish (${cardRankToString(game.wish)}) if you can! You cannot pass.`);
        return;
      }
    }
    stomp.publish(`/app/rooms/${roomId}/game/tichu/pass`, {});
  };

  const selectDragonReceiver = (giveRight: boolean) => {
    if (!haveToSelectDragonReceiver) {
      return;
    }
    stomp.publish(`/app/rooms/${roomId}/game/tichu/select-dragon-receiver`, {
      giveRight: giveRight
    });
  };

  const getTrickLabel = (trick: Trick) => {
    const formatRank = (rank: number) => {
      if (rank >= 2 && rank <= 14) return cardRankToString(rank as CardRank);
      else return rank.toString();
    };

    switch (trick.type) {
      case TrickType.SINGLE:
        const rank = (trick as SingleTrick).rank;
        const card = trick.cards[0];
        switch (card.type) {
          case CardType.STANDARD:
          case CardType.SPARROW:
            return `${formatRank(rank)} Single`;
          case CardType.PHOENIX:
            if (rank === 0) {
              return 'Phoenix';
            } else {
              return `Phoenix (above ${formatRank(Math.floor((trick as SingleTrick).rank))})`;
            }
          case CardType.DRAGON:
            return 'Dragon';
          case CardType.DOG:
            return 'Dog';
          default:
            return 'ERROR';
        }
      case TrickType.PAIR:
        return `${formatRank((trick as PairTrick).rank)} Pair`;
      case TrickType.CONSECUTIVE_PAIRS:
        return `${formatRank((trick as ConsecutivePairsTrick).maxRank)} Consecutive Pairs`;
      case TrickType.THREE_OF_A_KIND:
        return `${formatRank((trick as ThreeOfAKindTrick).rank)} Three of a Kind`;
      case TrickType.FULL_HOUSE:
        return `${formatRank((trick as FullHouseTrick).rank)} Full House`;
      case TrickType.STRAIGHT:
        return `${formatRank((trick as StraightTrick).maxRank)} Straight`;
      case TrickType.DOG:
        return 'Dog';
      case TrickType.FOUR_OF_A_KIND:
        return `${formatRank((trick as FourOfAKindTrick).rank)} Four of a Kind`;
      case TrickType.STRAIGHT_FLUSH:
        return `${formatRank((trick as StraightFlushTrick).maxRank)} Straight Flush`;
    }
  }

  const renderCard = (card: Card, isSelectable = false) => {
    return (
      <CardView
        key={`${card.type}-${card instanceof StandardCard ? (card.suit + '-' + card.rank) : ''}`}
        card={card}
        isSelected={selectedCards.some(c => c.equals(card))}
        isSelectable={isSelectable}
        onClick={() => isSelectable && toggleCardSelection(card)}
      />
    );
  };

  const sortCards = (cards: Card[], phoenixRank: number | undefined) => {
    const getCardSortKey = (card: Card): [number, number, number] => {
      if (card instanceof SparrowCard) {
        return [0, 0, 0];
      } else if (card instanceof StandardCard) {
        switch (card.suit) {
          case CardSuit.SPADE:
            return [1, card.rank, 0];
          case CardSuit.CLUB:
            return [1, card.rank, 1];
          case CardSuit.HEART:
            return [1, card.rank, 2];
          case CardSuit.DIAMOND:
            return [1, card.rank, 3];
        }
      } else if (card instanceof PhoenixCard) {
        if (phoenixRank === undefined) {
          return [2, 0, 0];
        } else {
          return [1, phoenixRank, 4];
        }
      } else if (card instanceof DragonCard) {
        return [3, 0, 0];
      } else if (card instanceof DogCard) {
        return [4, 0, 0];
      } else {
        return [5, 0, 0];
      }
    };

    return cards.toSorted((a, b) => {
      const ak = getCardSortKey(a);
      const bk = getCardSortKey(b);
      if (ak[0] !== bk[0]) {
        return ak[0] - bk[0];
      } else if (ak[1] !== bk[1]) {
        return ak[1] - bk[1];
      } else {
        return ak[2] - bk[2];
      }
    });
  }

  const renderTrick = (trick: Trick) => {
    let phoenixRank;
    if (trick instanceof SingleTrick && trick.isPhoenixUsed) {
      phoenixRank = trick.rank;
    } else if (trick instanceof PairTrick && trick.isPhoenixUsed) {
      phoenixRank = trick.rank;
    } else if (trick instanceof ThreeOfAKindTrick && trick.isPhoenixUsed) {
      phoenixRank = trick.rank;
    } else if (trick instanceof FullHouseTrick && trick.phoenixRank !== null) {
      phoenixRank = trick.phoenixRank;
    } else if (trick instanceof ConsecutivePairsTrick && trick.phoenixRank !== null) {
      phoenixRank = trick.phoenixRank;
    } else if (trick instanceof StraightTrick && trick.phoenixRank !== null) {
      phoenixRank = trick.phoenixRank;
    } else {
      phoenixRank = undefined;
    }

    return sortCards(trick.cards, phoenixRank).map(c => renderCard(c));
  }

  const getTeamCss = (team: Team | undefined) => {
    switch (team) {
      case Team.RED:
        return styles.teamRed;
      case Team.BLUE:
        return styles.teamBlue;
      default:
        return '';
    }
  }

  const renderPlayer = (position: PlayerPosition) => {
    const p = getPlayerAtPosition(position);
    if (p === undefined) {
      return null;
    }

    const hasTichuDeclaration = p.tichuDeclaration !== null && p.tichuDeclaration !== TichuDeclaration.NONE;
    const isMyTurn = game.turn === p.index;
    const isPassed = p.passed
      || game.roundStatus === RoundStatus.WAITING_LARGE_TICHU && p.tichuDeclaration === TichuDeclaration.NONE;

    let positionCss;
    switch (position) {
      case PlayerPosition.LEFT:
        positionCss = styles.playerLeft;
        break;
      case PlayerPosition.MID:
        positionCss = styles.playerTop;
        break;
      case PlayerPosition.RIGHT:
        positionCss = styles.playerRight;
        break;
    }

    return (
      <div className={`${styles.playerSection} ${positionCss}`}>
        <div className={styles.playerInfo}>
          <div className={`${styles.playerName} ${getTeamCss(p.team)}`}>{p.name}</div>
          <div className={styles.cardCount}>{p.cardCount} Cards</div>
          {hasTichuDeclaration && <div className={styles.tichuDeclaration}>{p.tichuDeclaration}</div>}
          {isMyTurn && <div className={styles.statusTurn}>Turn</div>}
          {isPassed && <div className={styles.statusPass}>PASS</div>}
        </div>
        <div className={styles.hand}>
          {[...new Array(p.cardCount)].map((_, i) => (
            <div key={i} className={`${styles.card} ${styles.back}`}/>
          ))}
        </div>
      </div>
    );
  };

  const handleSendChatMessage = () => {
    if (chatInput.trim() === '') {
      return;
    }
    stomp.publish(`/app/rooms/${roomId}/chat`, {
      message: chatInput
    });
    setChatInput('');
  };

  const handleKeyPressOnChatInput: KeyboardEventHandler = (event) => {
    if (event.key === 'Enter') {
      handleSendChatMessage();
    }
  };

  const parseWinningScore = (winningScore: TichuWinningScore) => {
    switch (winningScore) {
      case "ZERO":
        return "단판";
      case "TWO_HUNDRED":
        return "200";
      case "FIVE_HUNDRED":
        return "500";
      case "ONE_THOUSAND":
        return "1000";
      default:
        return 1000;
    }
  };

  const closeExchangeModal = () => {
    setIsExchangeModalOpen(false);
    setExchangeResult(null);
  };

  return (
    <div className={styles.tichuGameContainer}>
      <div className={`${styles.gameBoard} content`}>
        <div className={styles.displayTopLeft}>
          <div className={styles.scoreDisplayTopLeft}>
            <span className={styles.teamRedLabel}>RED</span>
            {scores[0]} : {scores[1]}
            <span className={styles.teamBlueLabel}>BLUE</span>
          </div>
          <input type="checkbox" className={styles.showRuleButton} checked={isRulePopupOpen}
                 onChange={() => setIsRulePopupOpen(!isRulePopupOpen)}/>
          {isRulePopupOpen &&
            <div className={styles.rulePopup}>
              <ul>
                <li><strong>승리 점수</strong>: {game.rule === null ? '' : parseWinningScore(game.rule.winningScore)}</li>
              </ul>
            </div>}
        </div>

        {/* Chat Area */}
        <div className={styles.tichuChatSection}>
          <div className={styles.tichuChatMessages}>
            {chatMessages.length === 0 ? (
              <div className={styles.tichuChatPlaceholder}>메시지가 없습니다.</div>
            ) : (
              chatMessages.map((msg, index) => (
                <div key={index} className={styles.tichuChatMessage}>
                  <strong>{game.players.find(m => m.id === msg.userId)?.name || 'Unknown'}:</strong> {msg.message}
                </div>
              ))
            )}
          </div>
          <div className={styles.tichuChatInputArea}>
            <input
              type="text"
              name="message"
              placeholder="메시지를 입력하세요..."
              value={chatInput}
              autoComplete="off"
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyPressOnChatInput}
            />
            <button onClick={handleSendChatMessage}>전송</button>
          </div>
        </div>

        {/* Top Player (Partner) */}
        {renderPlayer(PlayerPosition.MID)}

        {/* Left Player */}
        {renderPlayer(PlayerPosition.LEFT)}

        {/* Right Player */}
        {renderPlayer(PlayerPosition.RIGHT)}

        {/* Trick Area */}
        <div className={styles.trickArea}>
          {game.wish !== null && (
            <div className={styles.currentWishIndicator}>
              Wish: {cardRankToString(game.wish)}
            </div>
          )}
          {lastTrick !== null &&
            <>
              <div className={styles.playedBy}>Played by: {game.players[lastTrick.playerIndex]?.name}</div>
              <div className={styles.playedCards}>
                {renderTrick(lastTrick)}
              </div>
              <div className={styles.playedTrickLabel}>{getTrickLabel(lastTrick)}</div>
            </>}
          {isExchanging && (
            <div className={styles.exchangeSummary}>
              <div className={styles.exchangeSlot}>
                <div className={styles.slotLabel}>To Left</div>
                {exchangeSelection.left ?
                  renderCard(exchangeSelection.left) :
                  <div className={`${styles.card} ${styles.cardPlaceholder}`}>?</div>}
              </div>
              <div className={styles.exchangeSlot}>
                <div className={styles.slotLabel}>To Partner</div>
                {exchangeSelection.mid ?
                  renderCard(exchangeSelection.mid) :
                  <div className={`${styles.card} ${styles.cardPlaceholder}`}>?</div>}
              </div>
              <div className={styles.exchangeSlot}>
                <div className={styles.slotLabel}>To Right</div>
                {exchangeSelection.right ?
                  renderCard(exchangeSelection.right) :
                  <div className={`${styles.card} ${styles.cardPlaceholder}`}>?</div>}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Player (Me) */}
        <div className={`${styles.playerSection} ${styles.playerBottom}`}>
          <div className={styles.playerInfo}>
            <div className={`${styles.playerName} ${getTeamCss(playerMe?.team)}`}>{user.name}</div>
            <div className={styles.cardCount}>{game.hand.length} Cards</div>
            {playerMe !== undefined &&
              playerMe.tichuDeclaration !== null && playerMe.tichuDeclaration !== TichuDeclaration.NONE &&
              <div className={styles.tichuDeclaration}>{playerMe.tichuDeclaration}</div>}
            {game.turn === myIndex && <div className={styles.statusTurn}>Turn</div>}
            {playerMe !== undefined &&
              (playerMe.passed ||
                game.roundStatus === RoundStatus.WAITING_LARGE_TICHU &&
                playerMe.tichuDeclaration === TichuDeclaration.NONE
              ) &&
              <div className={styles.statusPass}>PASS</div>}
          </div>
          <div className={styles.controls}>
            {canDeclareLargeTichu &&
              <>
                <button className={styles.largeTichuButton} onClick={() => decideLargeTichuDeclaration(true)}>
                  Large Tichu
                </button>
                <button className={styles.passButton} onClick={() => decideLargeTichuDeclaration(false)}>
                  Pass
                </button>
              </>}
            {canDeclareSmallTichu &&
              <button className={styles.smallTichuButton} onClick={declareSmallTichu}>
                Small Tichu
              </button>}
            {isExchanging && (
              <>
                <button
                  className={styles.exchangeButton}
                  onClick={() => exchange(PlayerPosition.LEFT)}
                  disabled={selectedCards.length !== 1 || !!exchangeSelection.left}
                >
                  To Left ({getPlayerAtPosition(PlayerPosition.LEFT)?.name})
                </button>
                <button
                  className={styles.exchangeButton}
                  onClick={() => exchange(PlayerPosition.MID)}
                  disabled={selectedCards.length !== 1 || !!exchangeSelection.mid}
                >
                  To Partner ({getPlayerAtPosition(PlayerPosition.MID)?.name})
                </button>
                <button
                  className={styles.exchangeButton}
                  onClick={() => exchange(PlayerPosition.RIGHT)}
                  disabled={selectedCards.length !== 1 || !!exchangeSelection.right}
                >
                  To Right ({getPlayerAtPosition(PlayerPosition.RIGHT)?.name})
                </button>
              </>
            )}
            {game.phaseStatus === PhaseStatus.PLAYING &&
              <>
                {myTrick !== null && !isBomb(myTrick.type) &&
                  <button className={styles.playTrickButton} onClick={playTrick} disabled={!canPlayTrick}>
                    {getTrickLabel(myTrick)}
                  </button>
                }
                {myTrick !== null && isBomb(myTrick.type) &&
                  <button className={styles.playBombButton} onClick={playBomb} disabled={!canPlayBomb}>
                    {getTrickLabel(myTrick)}
                  </button>
                }
                <button className={styles.passButton} onClick={pass} disabled={!canPass}>
                  Pass
                </button>
              </>
            }
            {haveToSelectDragonReceiver && (
              <>
                <button onClick={() => selectDragonReceiver(false)}>
                  To Left ({getPlayerAtPosition(PlayerPosition.LEFT)?.name})
                </button>
                <button onClick={() => selectDragonReceiver(true)}>
                  To Right ({getPlayerAtPosition(PlayerPosition.RIGHT)?.name})
                </button>
              </>
            )}
          </div>
          <div className={styles.hand}>
            {sortCards(game.hand, undefined).map(card => renderCard(card, true))}
          </div>
        </div>
      </div>

      {isExchangeModalOpen && myIndex !== undefined && exchangeResult !== null && (
        <ExchangeResultModal
          result={exchangeResult}
          players={game.players}
          myIndex={myIndex}
          onClose={closeExchangeModal}
        />
      )}
      {isWishModalOpen && (
        <WishModal
          onSelect={(wish) => {
            setIsWishModalOpen(false);
            playTrickInternal(wish);
          }}
        />
      )}
      {scoreModalType !== null && (
        <ScoreModal
          scoresHistory={game.scoresHistory}
          players={game.players}
          type={scoreModalType}
          onClose={() => {
            if (scoreModalType === 'ROUND_END') {
              setScoreModalType(null);
            } else if (scoreModalType === 'END') {
              onGameEnd();
            }
          }}
        />
      )}
    </div>
  );
};

export default TichuPage;
