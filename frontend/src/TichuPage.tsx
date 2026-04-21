import { KeyboardEventHandler, MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from "./useAuth.tsx";
import './TichuPage.css';
import { Card, CardRank, CardType, StandardCard } from "@/games/tichu/domain/Card.ts";
import { PlayerIndex } from "@/games/tichu/types.ts";
import { PhaseStatus, RoundStatus, TichuGame } from "@/games/tichu/domain/TichuGame.ts";
import { TichuMessage, TichuMessageType } from "@/games/tichu/dtos/TichuMessage.ts";
import { ExchangeMessage } from "@/games/tichu/dtos/ExchangeMessage.ts";
import { Player } from "@/games/tichu/domain/Player.ts";
import { PlayerDto, TichuDto } from "@/games/tichu/dtos/TichuDto.ts";
import {
  ConsecutivePairsTrick,
  FourOfAKindTrick,
  FullHouseTrick,
  PairTrick,
  SingleTrick,
  StraightFlushTrick,
  StraightTrick,
  ThreeOfAKindTrick,
  Trick,
  TrickBuilder,
  TrickType
} from "@/games/tichu/domain/Trick.ts";
import { TichuDeclaration } from "@/games/tichu/domain/TichuDeclaration.ts";
import { PlayTrickMessage } from "@/games/tichu/dtos/PlayTrickMessage.ts";
import { PlayBombMessage } from "@/games/tichu/dtos/PlayBombMessage.ts";
import { useStomp } from "@/useStomp.tsx";
import { Cards } from "@/games/tichu/domain/Cards.ts";
import { TichuWinningScore } from "@/games/tichu/domain/TichuRule.ts";
import { ChatMessage } from "@/types.ts";
import { CardView } from "@/games/tichu/CardView.tsx";
import { CardMapper } from "@/games/tichu/mappers/CardMapper.ts";
import { TrickMapper } from "@/games/tichu/mappers/TrickMapper.ts";
import { CardDto } from "@/games/tichu/dtos/CardDto.ts";

const formatRank = (rank: number | undefined) => {
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  if (rank === 14) return 'A';
  return rank;
};

const ExchangeResultModal = ({ result, players, myIndex, onClose }: {result: ExchangeMessage, players: Player[], myIndex: PlayerIndex, onClose: MouseEventHandler<HTMLButtonElement> | undefined}) => {
  if (!result) return null;

  const getPartnerIndex = (idx: PlayerIndex) => (idx + 2) % 4 as PlayerIndex;
  const getLeftIndex = (idx: PlayerIndex) => (idx + 3) % 4 as PlayerIndex;
  const getRightIndex = (idx: PlayerIndex) => (idx + 1) % 4 as PlayerIndex;

  const exchanges = [
    { label: 'Left', index: getLeftIndex(myIndex), gave: result.gaveToLeft, received: result.receivedFromLeft },
    { label: 'Partner', index: getPartnerIndex(myIndex), gave: result.gaveToMid, received: result.receivedFromMid },
    { label: 'Right', index: getRightIndex(myIndex), gave: result.gaveToRight, received: result.receivedFromRight },
  ];

  return (
    <div className="exchange-modal-overlay">
      <div className="exchange-modal-content">
        <h2>Exchange Results</h2>
        <div className="exchange-results-container">
          <div className="exchange-section">
            <h3>You Gave</h3>
            <div className="exchange-grid">
              {exchanges.map((ex, i) => (
                <div key={`gave-${i}`} className="exchange-item">
                  <div className="target-player-name">{players[ex.index]?.name || ex.label}</div>
                  <div className="card-wrapper">
                    {ex.gave ? <CardView card={CardMapper.toCard(ex.gave)} /> : <div className="card card-placeholder">?</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="exchange-section">
            <h3>You Received</h3>
            <div className="exchange-grid">
              {exchanges.map((ex, i) => (
                <div key={`received-${i}`} className="exchange-item">
                  <div className="target-player-name">{players[ex.index]?.name || ex.label}</div>
                  <div className="card-wrapper">
                    {ex.received ? <CardView card={CardMapper.toCard(ex.received)} /> : <div className="card card-placeholder">?</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button className="btn-modal-close" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

const ScoreModal = ({ scoresHistory, players, type, onClose }: {scoresHistory: number[][], players: Player[], type: 'ROUND_END' | 'END', onClose: MouseEventHandler<HTMLButtonElement>}) => {
  if (!type) return null;

  const redTeam = [players[0], players[2]].map(p => p?.name).join(' & ');
  const blueTeam = [players[1], players[3]].map(p => p?.name).join(' & ');

  const redTotal = scoresHistory.reduce((sum, score) => sum + score[0], 0);
  const blueTotal = scoresHistory.reduce((sum, score) => sum + score[1], 0);

  return (
    <div className="score-modal-overlay">
      <div className="score-modal-content">
        <h2>Score Board</h2>
        <div className="score-table-container">
          <table className="score-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>{redTeam} (RED)</th>
                <th>{blueTeam} (BLUE)</th>
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
                <td>{redTotal}</td>
                <td>{blueTotal}</td>
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

const WishModal = ({ onSelect }: {onSelect: (arg0: CardRank | null) => void}) => {
  const ranks: { label: string, value: CardRank }[] = [
    { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
    { label: '5', value: 5 }, { label: '6', value: 6 }, { label: '7', value: 7 },
    { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 },
    { label: 'J', value: 11 }, { label: 'Q', value: 12 }, { label: 'K', value: 13 },
    { label: 'A', value: 14 }
  ];

  return (
    <div className="wish-modal-overlay">
      <div className="wish-modal-content">
        <h2>Make a Wish</h2>
        <p>Choose a rank to wish for</p>
        <div className="wish-grid">
          {ranks.map(r => (
            <button
              key={r.value}
              className="btn-wish"
              onClick={() => onSelect(r.value)}
            >
              {r.label}
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

const TichuPage = ({ roomId, stomp, chatMessages, onGameEnd }: {roomId: string, stomp: useStomp, chatMessages: ChatMessage[], onGameEnd: Function}) => {
  const { user } = useAuth();
  if (!user) {
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
            !card.equals(exchangeSelection.left)
            && !card.equals(exchangeSelection.mid)
            && !card.equals(exchangeSelection.right)
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
          let newTurn: PlayerIndex = (prev.players.findIndex(p => p.id === playBombMessage.playerId) + 1) % 4 as PlayerIndex;
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

  useEffect(() => {
    if (!user) {
      return;
    }

    const onMessageReceived = (message: TichuMessage) => {
      if (isPaused.current) {
        messageQueue.current.push(message);
      } else {
        handleTichuMessage(message);
      }
    };

    const destination = `/user/${user.id}/queue/game/tichu`;
    stomp.subscribe(destination, onMessageReceived);

    stomp.publish(`/app/rooms/${roomId}/game/tichu/get`, {});

    return () => stomp.unsubscribe(destination, onMessageReceived);
  }, [roomId, handleTichuMessage, user, processQueue]);

  const toggleCardSelection = (card: Card) => {
    setSelectedCards(prev => {
      if (prev.some(c => c.equals(card))) {
        return prev.filter(c => !c.equals(card));
      } else {
        return [...prev, card];
      }
    });
  };

  const handlePlayTrick = () => {
    if (selectedCards.length === 0) return;

    if (game.wish) {
      const lastTrick = getLastTrick();
      const canSatisfy = Cards.containsWishCard(game.hand, game.wish)
        && (lastTrick === null || lastTrick.canFulfillWishAfter(game.wish, game.hand));
      const satisfiesNow = Cards.extractStandardCards(selectedCards).some(card => card.rank === game.wish);

      if (canSatisfy && !satisfiesNow) {
        alert(`You must satisfy the wish (${formatRank(game.wish)}) if you can!`);
        return;
      }
    }

    const hasSparrow = selectedCards.some(card => card.type === CardType.SPARROW);
    if (hasSparrow) {
      setIsWishModalOpen(true);
    } else {
      executePlayTrick(null);
    }
  };

  const executePlayTrick = (wish: CardRank | null) => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/play-trick`, {
      cards: selectedCards,
      wish: wish,
    });
    setSelectedCards([]);
  };

  const handlePlayBomb = () => {
    if (selectedCards.length === 0) return;
    stomp.publish(`/app/rooms/${roomId}/game/tichu/play-bomb`, {
      cards: selectedCards
    });
    setSelectedCards([]);
  };

  const handlePass = () => {
    if (game.wish) {
      const lastTrick = getLastTrick();
      if (Cards.containsWishCard(game.hand, game.wish)
        && (lastTrick === null || lastTrick.canFulfillWishAfter(game.wish, game.hand))
      ) {
        alert(`You must satisfy the wish (${formatRank(game.wish)}) if you can! You cannot pass.`);
        return;
      }
    }
    stomp.publish(`/app/rooms/${roomId}/game/tichu/pass`, {});
  };

  const handleExchange = (direction: string) => {
    if (selectedCards.length !== 1) return;
    const card = selectedCards[0];

    const newSelection = { ...exchangeSelection, [direction]: card };
    setExchangeSelection(newSelection);

    stomp.publish(`/app/rooms/${roomId}/game/tichu/exchange`, {
      left: newSelection.left,
      mid: newSelection.mid,
      right: newSelection.right,
    });

    setGame(prev => ({
      ...prev,
      hand: prev.hand.filter(c => !card.equals(c))
    }));
    setSelectedCards([]);
  };

  const handleSelectDragonReceiver = (giveRight: boolean) => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/select-dragon-receiver`, {
      giveRight: giveRight
    });
  };

  const getLastTrick = () => {
    if (game.tricks.length === 0) {
      return null;
    } else {
      return game.tricks[game.tricks.length - 1];
    }
  };

  const lastTrick = getLastTrick();

  const getTrickLabel = (trick: Trick | null) => {
    if (trick === null) return null;
    switch (trick.type) {
      case TrickType.SINGLE:
        const card = trick.cards[0];
        switch (card.type) {
          case CardType.STANDARD:
          case CardType.SPARROW:
            return `${formatRank((trick as SingleTrick).rank)} Single`;
          case CardType.PHOENIX:
            return `Phoenix (above ${formatRank(Math.floor((trick as SingleTrick).rank))})`;
          case CardType.DRAGON:
            return 'Dragon';
          case CardType.DOG:
          default:
            return null;
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
      default:
        return null;
    }
  }

  const myIndex = game.players.findIndex(p => p.id === user.id) as PlayerIndex | -1;

  const getPlayerAt = (offset: number) => {
    if (myIndex === -1) return null;
    return game.players[(myIndex + offset) % 4];
  };

  const renderCard = (card: Card, isSelectable = true) => {
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

  const renderPlayer = (p: Player | null, position: string) => {
    if (!p) return null;
    const isMyTurn = game.turn === p.index;
    return (
      <div className={`player-section player-${position} ${isMyTurn ? 'active-turn' : ''}`}>
        <div className="player-info">
          <div className={`player-name team-${p.team}`}>{p.name}</div>
          <div className="card-count">{p.cardCount} Cards</div>
          {p.tichuDeclaration !== null && p.tichuDeclaration !== TichuDeclaration.NONE &&
            <div className="tichu-declaration">{p.tichuDeclaration}</div>}
          {isMyTurn && <div className="status-turn">Turn</div>}
          {(p.passed || game.roundStatus === RoundStatus.WAITING_LARGE_TICHU && p.tichuDeclaration === TichuDeclaration.NONE) &&
            <div className="status-pass">PASS</div>}
        </div>
        {position !== 'bottom' && (
          <div className="hand">
            {Array.from({ length: p.cardCount }).map((_, i) => (
              <div key={i} className="card back" />
            ))}
          </div>
        )}
      </div>
    );
  };

  const redTotal = game.scoresHistory.reduce((sum, score) => sum + score[0], 0);
  const blueTotal = game.scoresHistory.reduce((sum, score) => sum + score[1], 0);

  const parseWinningScore = (winningScore: TichuWinningScore) => {
    switch (winningScore) {
      case "ZERO": return "단판";
      case "TWO_HUNDRED": return "200";
      case "FIVE_HUNDRED": return "500";
      case "ONE_THOUSAND": return "1000";
      default: return 1000;
    }
  };

  const playerMe = game.players[myIndex];

  const canDeclareLargeTichu = game.roundStatus === RoundStatus.WAITING_LARGE_TICHU && playerMe && playerMe.tichuDeclaration === null;

  const decideLargeTichuDeclaration = (isLargeTichuDeclared: boolean) => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/large-tichu`, { isLargeTichuDeclared });
  }

  const canDeclareSmallTichu = (game.roundStatus === RoundStatus.EXCHANGING || game.hand.length === 14)
    && playerMe && playerMe.tichuDeclaration !== TichuDeclaration.LARGE && playerMe.tichuDeclaration !== TichuDeclaration.SMALL;

  const declareSmallTichu = () => stomp.publish(`/app/rooms/${roomId}/game/tichu/small-tichu`, {});

  const haveToSelectDragonReceiver = game.phaseStatus === PhaseStatus.WAITING_DRAGON_SELECTION && game.turn === myIndex;

  const myTrick = myIndex === -1 ? null : TrickBuilder.of(myIndex, selectedCards, getLastTrick()).build();

  const isBomb = (trickType: TrickType | undefined) => trickType === TrickType.FOUR_OF_A_KIND || trickType === TrickType.STRAIGHT_FLUSH;

  const canPlayCards = game.phaseStatus === PhaseStatus.PLAYING
    && myTrick && myTrick.canCoverUp(getLastTrick()) && (game.turn === myIndex || isBomb(myTrick.type) && getLastTrick() !== null);

  const closeExchangeModal = () => {
    setIsExchangeModalOpen(false);
    setExchangeResult(null);
  };

  return (
    <div className="tichu-game-container">
      <div className="game-board content">
        <div className="display-top-left">
          <div className="score-display-top-left">
            <span className="team-red-label">RED</span> {redTotal} : {blueTotal} <span className="team-blue-label">BLUE</span>
          </div>
          <input type="checkbox" className="show-rule-button" checked={isRulePopupOpen} onClick={() => setIsRulePopupOpen(!isRulePopupOpen)}/>
          {isRulePopupOpen &&
            <div className="rule-popup">
              <ul>
                <li><strong>승리 점수</strong>: {game.rule === null ? '' : parseWinningScore(game.rule.winningScore)}</li>
              </ul>
            </div>}
        </div>
        {/* Top Player (Partner) */}
        {renderPlayer(getPlayerAt(2), 'top')}

        {/* Left Player */}
        {renderPlayer(getPlayerAt(3), 'left')}

        {/* Right Player */}
        {renderPlayer(getPlayerAt(1), 'right')}

        {/* Trick Area */}
        <div className="trick-area">
          {game.wish !== null && (
            <div className="current-wish-indicator">
              Wish: {formatRank(game.wish)}
            </div>
          )}
          {lastTrick &&
            <>
              <div className="played-by">Played by: {game.players[lastTrick.playerIndex]?.name}</div>
              <div className="played-cards">
                {sortCards(lastTrick.cards || []).map(c => renderCard(c, false))}
              </div>
              <div className="played-trick-label">{getTrickLabel(lastTrick)}</div>
            </>}
          {game.roundStatus === RoundStatus.EXCHANGING && (
            <div className="exchange-summary">
              <div className="exchange-slot">
                <div className="slot-label">To Left</div>
                {exchangeSelection.left ? renderCard(exchangeSelection.left, false) :
                  <div className="card card-placeholder">?</div>}
              </div>
              <div className="exchange-slot">
                <div className="slot-label">To Partner</div>
                {exchangeSelection.mid ? renderCard(exchangeSelection.mid, false) :
                  <div className="card card-placeholder">?</div>}
              </div>
              <div className="exchange-slot">
                <div className="slot-label">To Right</div>
                {exchangeSelection.right ? renderCard(exchangeSelection.right, false) :
                  <div className="card card-placeholder">?</div>}
              </div>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="tichu-chat-section">
          <div className="tichu-chat-messages">
            {chatMessages.length === 0 ? (
              <div className="tichu-chat-placeholder">메시지가 없습니다.</div>
            ) : (
              chatMessages.map((msg, index) => (
                <div key={index} className="tichu-chat-message">
                  <strong>{game.players.find(m => m.id === msg.userId)?.name || 'Unknown'}:</strong> {msg.message}
                </div>
              ))
            )}
          </div>
          <div className="tichu-chat-input-area">
            <input
              type="text"
              name="message"
              placeholder="메시지를 입력하세요..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyPressOnChatInput}
            />
            <button onClick={handleSendChatMessage}>전송</button>
          </div>
        </div>

        {/* Bottom Player (Me) */}
        <div className="player-section player-bottom">
          <div className="player-info">
            <div className={`player-name team-${playerMe?.team}`}>{user.name}</div>
            <div className="card-count">{game.hand.length} Cards</div>
            {playerMe && playerMe.tichuDeclaration !== null && playerMe.tichuDeclaration !== TichuDeclaration.NONE &&
              <div className="tichu-declaration">{playerMe.tichuDeclaration}</div>}
            {game.turn === myIndex && <div className="status-turn">Turn</div>}
            {playerMe && (playerMe.passed || game.roundStatus === RoundStatus.WAITING_LARGE_TICHU && playerMe.tichuDeclaration === TichuDeclaration.NONE) &&
              <div className="status-pass">PASS</div>}
          </div>
          <div className="controls">
            {canDeclareLargeTichu &&
              <>
                <button className="large-tichu-button" onClick={() => decideLargeTichuDeclaration(true)}>
                  Large Tichu
                </button>
                <button className="pass-button" onClick={() => decideLargeTichuDeclaration(false)}>
                  Pass
                </button>
              </>}
            {canDeclareSmallTichu &&
              <button className="small-tichu-button" onClick={declareSmallTichu}>
                Small Tichu
              </button>}
            {game.roundStatus === RoundStatus.EXCHANGING && (
              <>
                <button
                  className="exchange-button"
                  onClick={() => handleExchange('left')}
                  disabled={selectedCards.length !== 1 || !!exchangeSelection.left}
                >
                  To Left ({getPlayerAt(3)?.name})
                </button>
                <button
                  className="exchange-button"
                  onClick={() => handleExchange('mid')}
                  disabled={selectedCards.length !== 1 || !!exchangeSelection.mid}
                >
                  To Partner ({getPlayerAt(2)?.name})
                </button>
                <button
                  className="exchange-button"
                  onClick={() => handleExchange('right')}
                  disabled={selectedCards.length !== 1 || !!exchangeSelection.right}
                >
                  To Right ({getPlayerAt(1)?.name})
                </button>
              </>
            )}
            {game.roundStatus === 'PLAYING' && !haveToSelectDragonReceiver &&
              <>
                {(myTrick || (selectedCards.length === 1 && selectedCards[0].type === CardType.PHOENIX)) && !isBomb(myTrick?.type) &&
                  <button
                    className="play-trick-button"
                    onClick={handlePlayTrick}
                    disabled={!canPlayCards}
                  >
                    {getTrickLabel(myTrick) || (selectedCards.length === 1 && selectedCards[0].type === CardType.PHOENIX && 'Phoenix') || 'Invalid'}
                  </button>
                }
                {myTrick && isBomb(myTrick.type) &&
                  <button
                    className="play-bomb-button"
                    onClick={handlePlayBomb}
                    disabled={!canPlayCards}
                  >
                    {getTrickLabel(myTrick) || 'Invalid'}
                  </button>
                }
                <button className="pass-button" onClick={handlePass} disabled={game.turn !== myIndex || getLastTrick() === null}>
                  Pass
                </button>
              </>
            }
            {haveToSelectDragonReceiver && (
              <>
                <button onClick={() => handleSelectDragonReceiver(false)}>
                  To Left ({getPlayerAt(3)?.name})
                </button>
                <button onClick={() => handleSelectDragonReceiver(true)}>
                  To Right ({getPlayerAt(1)?.name})
                </button>
              </>
            )}
          </div>
          <div className="hand">
            {sortCards(game.hand).map(card => renderCard(card))}
          </div>
        </div>
      </div>

      {scoreModalType && (
        <ScoreModal
          scoresHistory={game.scoresHistory}
          players={game.players}
          type={scoreModalType}
          onClose={() => {
            if (scoreModalType === 'ROUND_END') {
              setScoreModalType(null);
            } else {
              onGameEnd();
            }
          }}
        />
      )}
      {isExchangeModalOpen && myIndex !== -1 && exchangeResult !== null && (
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
            executePlayTrick(wish);
          }}
        />
      )}
    </div>
  );
};

export default TichuPage;
