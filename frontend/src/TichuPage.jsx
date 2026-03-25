import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from "./useAuth.jsx";
import {
  areCardsEqual,
  includesCard,
  excludeCards,
  sortCards,
  CardType,
} from './utils/cardUtils.js';
import { identifyTrick, appendTrickInfo, canCoverUp, canSatisfyWish, TrickType, isBomb } from './utils/trickUtils.js';
import './TichuPage.css';
import dogImg from './assets/tichu/dog.png';
import dragonImg from './assets/tichu/dragon.png';
import phoenixImg from './assets/tichu/phoenix.png';
import sparrowImg from './assets/tichu/sparrow.png';

const ScoreModal = ({ scoresHistory, players, type, onClose }) => {
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

const WishModal = ({ onSelect, onClose }) => {
  const ranks = [
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

const TichuPage = ({ roomId, stomp, chatMessages }) => {
  const { user } = useAuth();

  const [gameState, setGameState] = useState({
    rule: null,
    players: [], // {id, name, team, index, cardCount, tichuDeclaration, exitOrder, passed}
    scoresHistory: [],
    hand: [], // My cards
    roundStatus: null,
    wish: null,
    phaseStatus: null,
    turn: null,
    tricks: [], // {playerIndex, type, cards}
  });

  const [selectedCards, setSelectedCards] = useState([]);
  const [exchangeSelection, setExchangeSelection] = useState({ left: null, mid: null, right: null });
  const [scoreModalType, setScoreModalType] = useState(null); // null, 'ROUND_END', 'END'
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const messageQueue = useRef([]);
  const isPaused = useRef(false);
  const handleTichuMessageRef = useRef(null);
  const [isRulePopupOpen, setIsRulePopupOpen] = useState(false);

  // Resume processing when delay ends
  const processQueue = useCallback(() => {
    while (messageQueue.current.length > 0 && !isPaused.current) {
      const msg = messageQueue.current.shift();
      if (handleTichuMessageRef.current) {
        handleTichuMessageRef.current(msg);
      }
      // If handleTichuMessage triggered another pause, stop processing
      if (isPaused.current) break;
    }
  }, []); // No dependencies needed as it uses Refs

  const handleTichuMessage = useCallback((message) => {
    console.log('Tichu Message:', message);
    const data = message.data;
    switch (message.type) {
      case 'START':
        setGameState(prev => ({
          ...prev,
          players: data.map((p, i) => ({
            ...p,
            index: i,
            cardCount: 0,
            tichuDeclaration: null,
            exitOrder: 0,
            passed: false,
          })),
        }));
        break;
      case 'GET':
        const getPassed = (index, phaseStatus, turn, lastTrick) => {
          if (phaseStatus === 'WAITING_DRAGON_SELECTION') {
            return index !== turn;
          }
          if (index === turn) return false;
          if (lastTrick.playerIndex < turn) {
            return lastTrick.playerIndex < index && index < turn;
          } else {
            return index < turn || lastTrick.playerIndex < index;
          }
        }
        setGameState({
          rule: data.rule,
          players: data.players.map((p, i) => ({
            ...p,
            index: i,
            cardCount: data.handCounts[p.id],
            tichuDeclaration: data.tichuDeclarations[i],
            exitOrder: data.exitOrder[i],
            passed: data.roundStatus !== 'PLAYING' ? false : (
              data.exitOrder[i] !== 0 ? false : (
                data.tricks.length === 0 ? false : getPassed(i, data.phaseStatus, data.turn, data.tricks[data.tricks.length - 1])
              )
            ),
          })),
          scoresHistory: data.scoresHistory,
          hand: data.myHand.filter(card => !areCardsEqual(card, exchangeSelection.left) && !areCardsEqual(card, exchangeSelection.mid) && !areCardsEqual(card, exchangeSelection.right)),
          roundStatus: data.roundStatus,
          wish: data.wish,
          phaseStatus: data.phaseStatus,
          turn: data.turn,
          tricks: data.tricks === null ? [] : data.tricks,
        });
        break;
      case 'INIT_FIRST_DRAWS':
        setSelectedCards([]);
        setGameState(prev => ({
          ...prev,
          hand: data,
          players: prev.players.map(p => ({
            ...p,
            cardCount: 8,
            tichuDeclaration: null,
            exitOrder: 0,
            passed: false,
          })),
          roundStatus: 'WAITING_LARGE_TICHU',
          wish: null,
          phaseStatus: null,
          turn: null,
          tricks: [],
        }));
        break;
      case 'LARGE_TICHU':
        setGameState(prev => ({
          ...prev,
          players: prev.players.map((p, i) => ({ ...p, tichuDeclaration: data[i] })),
        }));
        break;
      case 'ADD_SECOND_DRAWS':
        setGameState(prev => ({
          ...prev,
          hand: data,
          players: prev.players.map(p => ({ ...p, cardCount: 14 })),
          roundStatus: 'EXCHANGING',
        }));
        break;
      case 'SMALL_TICHU':
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => {
            if (p.id === data) {
              return { ...p, tichuDeclaration: 'SMALL' };
            } else {
              return p;
            }
          }),
        }));
        break;
      case 'EXCHANGE':
        setExchangeSelection({ left: null, mid: null, right: null });
        setGameState(prev => {
          const cardsToExclude = [data.gaveToLeft, data.gaveToMid, data.gaveToRight].filter(Boolean);
          const newHand = excludeCards(prev.hand, cardsToExclude);
          newHand.push(data.receivedFromLeft, data.receivedFromMid, data.receivedFromRight);
          return ({
            ...prev,
            hand: newHand.filter(Boolean),
            roundStatus: 'PLAYING',
          });
        });
        break;
      case 'PHASE_START':
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => ({ ...p, passed: false })),
          phaseStatus: 'PLAYING',
          turn: data,
          tricks: [],
        }));
        break;
      case 'PLAY_TRICK':
        setGameState(prev => {
          const newHand = user.id === data.playerId
            ? excludeCards(prev.hand, data.trick.cards)
            : prev.hand;
          const newWish = data.wish !== null
            ? data.wish
            : (prev.wish !== null
              ? (data.trick.cards.map(card => card.rank).includes(prev.wish)
                ? null
                : prev.wish)
              : null);
          let newTurn = (prev.turn + 1) % 4;
          while (prev.players[newTurn].exitOrder !== 0) {
            newTurn = (newTurn + 1) % 4;
          }
          return {
            ...prev,
            players: prev.players.map(p => {
              if (p.id === data.playerId) {
                const newCardCount = p.cardCount - data.trick.cards.length;
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
            tricks: [...prev.tricks, data.trick],
          };
        });
        if (data.trick.type === TrickType.DOG) {
          isPaused.current = true;
          setTimeout(() => {
            isPaused.current = false;
            processQueue();
          }, 1000);
        }
        break;
      case 'PLAY_BOMB':
        setGameState(prev => {
          const newHand = user.id === data.playerId
            ? excludeCards(prev.hand, data.bomb.cards)
            : prev.hand;
          const newWish = prev.wish !== null
            ? (data.bomb.cards.map(card => card.rank).includes(prev.wish)
              ? null
              : prev.wish)
            : null;
          let newTurn = (prev.players.findIndex(p => p.id === data.playerId) + 1) % 4;
          while (prev.players[newTurn].exitOrder !== 0) {
            newTurn = (newTurn + 1) % 4;
          }
          return {
            ...prev,
            players: prev.players.map(p => {
              if (p.id === data.playerId) {
                const newCardCount = p.cardCount - data.bomb.cards.length;
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
            tricks: [...prev.tricks, data.bomb],
          };
        });
        break;
      case 'PASS':
        setGameState(prev => {
          let newTurn = (prev.turn + 1) % 4;
          while (prev.players[newTurn].exitOrder !== 0) {
            newTurn = (newTurn + 1) % 4;
          }
          return ({
            ...prev,
            players: prev.players.map(p => p.id === data ? { ...p, passed: true } : p),
            turn: newTurn,
          });
        });
        break;
      case 'PHASE_END_WITH_DRAGON':
        setGameState(prev => ({
          ...prev,
          phaseStatus: 'WAITING_DRAGON_SELECTION',
          turn: data,
        }));
        break;
      case 'SELECT_DRAGON_RECEIVER':
        break;
      case 'ROUND_END':
        setGameState(prev => ({
          ...prev,
          scoresHistory: data,
        }));
        isPaused.current = true;
        setTimeout(() => {
          setScoreModalType('ROUND_END');
          isPaused.current = false;
          processQueue();
        }, 1000);
        break;
      case 'END':
        setGameState(prev => ({
          ...prev,
          scoresHistory: data,
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
    if (!user) {
      return;
    }

    const onMessageReceived = (message) => {
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

  const toggleCardSelection = (card) => {
    setSelectedCards(prev => {
      if (includesCard(prev, card)) {
        return prev.filter(c => !areCardsEqual(c, card));
      } else {
        return [...prev, card];
      }
    });
  };

  const handlePlayTrick = () => {
    if (selectedCards.length === 0) return;

    if (gameState.wish) {
      const lastTrick = getLastTrick();
      const canSatisfy = canSatisfyWish(gameState.hand, gameState.wish, lastTrick);
      const satisfiesNow = selectedCards.some(card => card.rank === gameState.wish);

      if (canSatisfy && !satisfiesNow) {
        alert(`You must satisfy the wish (${formatRank(gameState.wish)}) if you can!`);
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

  const executePlayTrick = (wish) => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/play-trick`, {
      cards: selectedCards,
      wish: wish,
    });
    setSelectedCards([]);
    setIsWishModalOpen(false);
  };

  const handlePlayBomb = () => {
    if (selectedCards.length === 0) return;
    stomp.publish(`/app/rooms/${roomId}/game/tichu/play-bomb`, {
      cards: selectedCards
    });
    setSelectedCards([]);
  };

  const handlePass = () => {
    if (gameState.wish) {
      const lastTrick = getLastTrick();
      if (canSatisfyWish(gameState.hand, gameState.wish, lastTrick)) {
        alert(`You must satisfy the wish (${formatRank(gameState.wish)}) if you can! You cannot pass.`);
        return;
      }
    }
    stomp.publish(`/app/rooms/${roomId}/game/tichu/pass`, {});
  };

  const handleExchange = (direction) => {
    if (selectedCards.length !== 1) return;
    const card = selectedCards[0];

    const newSelection = { ...exchangeSelection, [direction]: card };
    setExchangeSelection(newSelection);

    stomp.publish(`/app/rooms/${roomId}/game/tichu/exchange`, {
      left: newSelection.left,
      mid: newSelection.mid,
      right: newSelection.right,
    });

    setGameState(prev => ({
      ...prev,
      hand: excludeCards(prev.hand, card)
    }));
    setSelectedCards([]);
  };

  const handleSelectDragonReceiver = (giveRight) => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/select-dragon-receiver`, {
      giveRight: giveRight
    });
  };

  const getLastTrick = () => {
    if (gameState.tricks.length === 0) {
      return null;
    } else if (gameState.tricks.length === 1) {
      const lastTrick = gameState.tricks[0];
      return appendTrickInfo(lastTrick, null);
    } else {
      const lastTrick = gameState.tricks[gameState.tricks.length - 1];
      const secondLastTrick = gameState.tricks[gameState.tricks.length - 2];
      return appendTrickInfo(lastTrick, secondLastTrick);
    }
  };

  const formatRank = (rank) => {
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    if (rank === 14) return 'A';
    return rank;
  }

  const getTrickLabel = (trick) => {
    if (trick === null) return null;
    switch (trick.type) {
      case TrickType.SINGLE:
        const card = trick.cards[0];
        switch (card.type) {
          case CardType.STANDARD:
          case CardType.SPARROW:
            return `${formatRank(trick.rank)} Single`;
          case CardType.PHOENIX:
            return `Phoenix (above ${formatRank(Math.floor(trick.rank))})`;
          case CardType.DRAGON:
            return 'Dragon';
          case CardType.DOG:
          default:
            return null;
        }
      case TrickType.PAIR:
        return `${formatRank(trick.rank)} Pair`;
      case TrickType.CONSECUTIVE_PAIRS:
        return `${formatRank(trick.maxRank)} Consecutive Pairs`;
      case TrickType.THREE_OF_A_KIND:
        return `${formatRank(trick.rank)} Three of a Kind`;
      case TrickType.FULL_HOUSE:
        return `${formatRank(trick.rank)} Full House`;
      case TrickType.STRAIGHT:
        return `${formatRank(trick.maxRank)} Straight`;
      case TrickType.DOG:
        return 'Dog';
      case TrickType.FOUR_OF_A_KIND:
        return `${formatRank(trick.rank)} Four of a Kind`;
      case TrickType.STRAIGHT_FLUSH:
        return `${formatRank(trick.maxRank)} Straight Flush`;
      default:
        return null;
    }
  }

  const myIndex = gameState.players.findIndex(p => p.id === user.id);

  const getPlayerAt = (offset) => {
    if (myIndex === -1) return null;
    return gameState.players[(myIndex + offset) % 4];
  };

  const renderCard = (card, isSelectable = true) => {
    const getSuitIcon = (suit) => {
      switch (suit) {
        case 'SPADE': return '♠';
        case 'HEART': return '♥';
        case 'DIAMOND': return '♦';
        case 'CLUB': return '♣';
        default: return '';
      }
    };

    const isSpecial = card.type !== CardType.STANDARD;
    const suitIcon = getSuitIcon(card.suit);
    const rankLabel = isSpecial ? null : formatRank(card.rank);

    let centerContent = null;
    if (isSpecial) {
      let imgSrc = null;
      switch (card.type) {
        case CardType.SPARROW: imgSrc = sparrowImg; break;
        case CardType.PHOENIX: imgSrc = phoenixImg; break;
        case CardType.DRAGON: imgSrc = dragonImg; break;
        case CardType.DOG: imgSrc = dogImg; break;
        default: break;
      }
      if (imgSrc) {
        centerContent = <img src={imgSrc} alt={card.type} className="card-image" />;
      } else {
        centerContent = <span className="special-label">{card.type}</span>;
      }
    } else {
      centerContent = <span className="card-center-icon">{suitIcon}</span>;
    }

    return (
      <div
        key={`${card.type}-${card.suit}-${card.rank}`}
        className={`card ${includesCard(selectedCards, card) ? 'selected' : ''} suit-${card.suit} ${isSpecial ? 'special-card' : ''}`}
        onClick={() => isSelectable && toggleCardSelection(card)}
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
  };

  const renderPlayer = (p, position) => {
    if (!p) return null;
    const isMyTurn = gameState.turn === p.index;
    return (
      <div className={`player-section player-${position} ${isMyTurn ? 'active-turn' : ''}`}>
        <div className="player-info">
          <div className={`player-name team-${p.team}`}>{p.name}</div>
          <div className="card-count">{p.cardCount} Cards</div>
          {p.tichuDeclaration !== null && p.tichuDeclaration !== 'NONE' &&
            <div className="tichu-declaration">{p.tichuDeclaration}</div>}
          {isMyTurn && <div className="status-turn">Turn</div>}
          {p.passed && <div className="status-pass">PASS</div>}
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

  const redTotal = gameState.scoresHistory.reduce((sum, score) => sum + score[0], 0);
  const blueTotal = gameState.scoresHistory.reduce((sum, score) => sum + score[1], 0);

  const parseWinningScore = (winningScore) => {
    switch (winningScore) {
      case "ZERO": return "단판";
      case "TWO_HUNDRED": return "200";
      case "FIVE_HUNDRED": return "500";
      case "ONE_THOUSAND": return "1000";
      default: return 1000;
    }
  };

  const playerMe = gameState.players[myIndex];

  const canDeclareLargeTichu = gameState.roundStatus === 'WAITING_LARGE_TICHU' && playerMe && playerMe.tichuDeclaration === null;

  const decideLargeTichuDeclaration = (isLargeTichuDeclared) => {
    stomp.publish(`/app/rooms/${roomId}/game/tichu/large-tichu`, { isLargeTichuDeclared });
  }

  const canDeclareSmallTichu = (gameState.roundStatus === 'EXCHANGING' || gameState.hand.length === 14)
    && playerMe && playerMe.tichuDeclaration !== 'LARGE' && playerMe.tichuDeclaration !== 'SMALL';

  const declareSmallTichu = () => stomp.publish(`/app/rooms/${roomId}/game/tichu/small-tichu`, {});

  const haveToSelectDragonReceiver = gameState.phaseStatus === 'WAITING_DRAGON_SELECTION' && gameState.turn === myIndex;

  const myTrick = identifyTrick(selectedCards, getLastTrick());

  const canPlayCards = gameState.phaseStatus === "PLAYING"
    && myTrick && canCoverUp(myTrick, getLastTrick()) && (gameState.turn === myIndex || isBomb(myTrick.type) && getLastTrick() !== null);

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
                <li><strong>승리 점수</strong>: {parseWinningScore(gameState.rule.winningScore)}</li>
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
          {gameState.wish !== null && (
            <div className="current-wish-indicator">
              Wish: {formatRank(gameState.wish)}
            </div>
          )}
          {getLastTrick() &&
            <>
              <div className="played-by">Played by: {gameState.players[getLastTrick().playerIndex]?.name}</div>
              <div className="played-cards">
                {sortCards(getLastTrick().cards || []).map(c => renderCard(c, false))}
              </div>
              <div className="played-trick-label">{getTrickLabel(getLastTrick())}</div>
            </>}
          {gameState.roundStatus === 'EXCHANGING' && (
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

        {/* Bottom Player (Me) */}
        <div className="player-section player-bottom">
          <div className="player-info">
            <div className={`player-name team-${gameState.players[myIndex]?.team}`}>{user.name}</div>
            <div className="card-count">{gameState.hand.length} Cards</div>
            {gameState.players[myIndex] && gameState.players[myIndex].tichuDeclaration !== null && gameState.players[myIndex].tichuDeclaration !== 'NONE' &&
              <div className="tichu-declaration">{gameState.players[myIndex].tichuDeclaration}</div>}
            {gameState.turn === myIndex && <div className="status-turn">Turn</div>}
            {gameState.players[myIndex] && gameState.players[myIndex].passed && <div className="status-pass">PASS</div>}
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
            {gameState.roundStatus === 'EXCHANGING' && (
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
            {gameState.roundStatus === 'PLAYING' && !haveToSelectDragonReceiver &&
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
                <button className="pass-button" onClick={handlePass} disabled={gameState.turn !== myIndex || getLastTrick() === null}>
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
            {sortCards(gameState.hand).map(card => renderCard(card))}
          </div>
        </div>
      </div>

      {scoreModalType && (
        <ScoreModal
          scoresHistory={gameState.scoresHistory}
          players={gameState.players}
          type={scoreModalType}
          onClose={() => setScoreModalType(null)}
        />
      )}
      {isWishModalOpen && (
        <WishModal
          onSelect={executePlayTrick}
          onClose={() => setIsWishModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TichuPage;
