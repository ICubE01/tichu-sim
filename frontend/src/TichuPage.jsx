import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from "./useAuth.jsx";
import { areCardsEqual, includesCard, excludeCards } from './utils/cardUtils.js';
import './TichuPage.css';

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

const TichuPage = ({ roomId, stomp, chatMessages }) => {
  const { user } = useAuth();

  const [gameState, setGameState] = useState({
    rule: null,
    players: [], // {id, name, index, cardCount, tichuDeclaration, exitOrder, passed}
    scoresHistory: [],
    hand: [], // My cards
    roundStatus: null,
    wish: null,
    phaseStatus: null,
    turn: null,
    lastTrick: null, // {playerIndex, type, cards}
  });

  const [selectedCards, setSelectedCards] = useState([]);
  const [exchangeSelection, setExchangeSelection] = useState({ left: null, mid: null, right: null });
  const [scoreModalType, setScoreModalType] = useState(null); // null, 'ROUND_END', 'END'

  const handleTichuMessage = useCallback((message) => {
    console.log('Tichu Message:', message);
    const data = message.data;
    switch (message.type) {
      case 'START':
        setGameState(prev => ({
          ...prev,
          players: data.players.map((p, i) => ({
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
        setGameState({
          rule: data.rule,
          players: data.players.map((p, i) => ({
            ...p,
            index: i,
            cardCount: data.handCounts[p.id],
            tichuDeclaration: data.tichuDeclarations[i],
            exitOrder: 0,
            passed: false,
          })),
          scoresHistory: data.scoresHistory,
          hand: data.myHand,
          roundStatus: data.roundStatus,
          wish: data.wish,
          phaseStatus: data.phaseStatus,
          turn: data.turn,
          lastTrick: data.lastTrick,
        });
        break;
      case 'INIT_FIRST_DRAWS':
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
          lastTrick: null,
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
          lastTrick: null,
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
            lastTrick: data.trick,
          };
        });
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
          let newTurn = (prev.turn + 1) % 4;
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
            lastTrick: data.bomb,
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
        setTimeout(() => {
          setScoreModalType('ROUND_END');
        }, 1000);
        break;
      case 'END':
        setGameState(prev => ({
          ...prev,
          scoresHistory: data,
        }));
        setTimeout(() => {
          setScoreModalType('END');
        }, 1000);
        break;
      default:
        break;
    }
  }, [user.id]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const destination = `/user/${user.id}/queue/game/tichu`;
    stomp.subscribe(destination, handleTichuMessage);

    stomp.publish(`/app/rooms/${roomId}/game/tichu/get`, {});

    return () => stomp.unsubscribe(destination, handleTichuMessage);
  }, [roomId, handleTichuMessage, user]);

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
    stomp.publish(`/app/rooms/${roomId}/game/tichu/play-trick`, {
      cards: selectedCards
    });
    setSelectedCards([]);
  };

  const handlePass = () => {
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

  const myIndex = gameState.players.findIndex(p => p.id === user.id);

  const getPlayerAt = (offset) => {
    if (myIndex === -1) return null;
    return gameState.players[(myIndex + offset) % 4];
  };

  const renderCard = (card, isSelectable = true) => (
    <div
      key={`${card.type}-${card.suit}-${card.rank}`}
      className={`card ${includesCard(selectedCards, card) ? 'selected' : ''} suit-${card.suit}`}
      onClick={() => isSelectable && toggleCardSelection(card)}
    >
      <div className="card-top">
        <span>{card.type}</span>
        <span>{card.rank}</span>
        <span>{card.suit}</span>
      </div>
      <div className="card-bottom">
        <span>{card.rank}</span>
        <span>{card.suit}</span>
      </div>
    </div>
  );

  const renderPlayer = (p, position) => {
    if (!p) return null;
    const isMyTurn = gameState.turn === p.index;
    return (
      <div className={`player-section player-${position} ${isMyTurn ? 'active-turn' : ''}`}>
        <div className="player-info">
          <div className="player-name">{p.name}</div>
          <div className="card-count">{p.cardCount} Cards</div>
          {p.tichuDeclaration !== null && p.tichuDeclaration !== 'NONE' &&
            <div className="tichuDeclaration">{p.tichuDeclaration}</div>}
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

  return (
    <div className="tichu-game-container">
      <div className="game-board">
        {/* Top Player (Partner) */}
        {renderPlayer(getPlayerAt(2), 'top')}

        {/* Left Player */}
        {renderPlayer(getPlayerAt(3), 'left')}

        {/* Right Player */}
        {renderPlayer(getPlayerAt(1), 'right')}

        {/* Trick Area */}
        <div className="trick-area">
          {gameState.lastTrick ? (
            <>
              <div className="played-by">Played
                by: {gameState.players[gameState.lastTrick.playerIndex]?.name}</div>
              <div className="played-cards">
                {(gameState.lastTrick.cards || []).map(c => renderCard(c, false))}
              </div>
            </>
          ) : (
            <div className="trick-placeholder">Trick Area</div>
          )}
        </div>

        {/* Bottom Player (Me) */}
        <div className="player-section player-bottom">
          <div className="player-info">
            <div className="player-name">{user.name} (ME)</div>
            <div className="card-count">{gameState.hand.length} Cards</div>
            {gameState.players[myIndex] && gameState.players[myIndex].tichuDeclaration !== null && gameState.players[myIndex].tichuDeclaration !== 'NONE' &&
              <div className="tichuDeclaration">{gameState.players[myIndex].tichuDeclaration}</div>}
            {gameState.turn === myIndex && <div className="status-turn">Turn</div>}
            {gameState.players[myIndex] && gameState.players[myIndex].passed && <div className="status-pass">PASS</div>}
          </div>
          <div className="hand">
            {gameState.hand.map(card => renderCard(card))}
          </div>
          {gameState.roundStatus === 'EXCHANGING' && (
            <div className="exchange-summary">
              <div className="exchange-slot">
                <div className="slot-label">To Left</div>
                {exchangeSelection.left ? renderCard(exchangeSelection.left, false) :
                  <div className="card-placeholder">?</div>}
              </div>
              <div className="exchange-slot">
                <div className="slot-label">To Partner</div>
                {exchangeSelection.mid ? renderCard(exchangeSelection.mid, false) :
                  <div className="card-placeholder">?</div>}
              </div>
              <div className="exchange-slot">
                <div className="slot-label">To Right</div>
                {exchangeSelection.right ? renderCard(exchangeSelection.right, false) :
                  <div className="card-placeholder">?</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="controls">
        <button
          className="btn-game btn-trick"
          onClick={handlePlayTrick}
          disabled={selectedCards.length === 0 || gameState.turn !== myIndex}
        >
          Play Trick
        </button>
        <button
          className="btn-game btn-pass"
          onClick={handlePass}
          disabled={gameState.turn !== myIndex || gameState.lastTrick === null}
        >
          Pass
        </button>
        <button
          className="btn-game btn-large-tichu"
          onClick={() => stomp.publish(`/app/rooms/${roomId}/game/tichu/large-tichu`, { isLargeTichuDeclared: true })}
          disabled={gameState.roundStatus !== 'WAITING_LARGE_TICHU' || gameState.players[myIndex].tichuDeclaration !== null}
        >
          Large Tichu
        </button>
        <button
          className="btn-game btn-pass-large-tichu"
          onClick={() => stomp.publish(`/app/rooms/${roomId}/game/tichu/large-tichu`, { isLargeTichuDeclared: false })}
          disabled={gameState.roundStatus !== 'WAITING_LARGE_TICHU' || gameState.players[myIndex].tichuDeclaration !== null}
        >
          Large Tichu Pass
        </button>
        <button
          className="btn-game btn-small-tichu"
          onClick={() => stomp.publish(`/app/rooms/${roomId}/game/tichu/small-tichu`, {})}
          disabled={gameState.hand.length !== 14 || (gameState.players[myIndex].tichuDeclaration === 'LARGE' || gameState.players[myIndex].tichuDeclaration === 'SMALL')}
        >
          Small Tichu
        </button>
        {gameState.roundStatus === 'EXCHANGING' && (
          <div className="exchange-controls">
            <button
              className="btn-game btn-exchange"
              onClick={() => handleExchange('left')}
              disabled={selectedCards.length !== 1 || !!exchangeSelection.left}
            >
              To Left
            </button>
            <button
              className="btn-game btn-exchange"
              onClick={() => handleExchange('mid')}
              disabled={selectedCards.length !== 1 || !!exchangeSelection.mid}
            >
              To Partner
            </button>
            <button
              className="btn-game btn-exchange"
              onClick={() => handleExchange('right')}
              disabled={selectedCards.length !== 1 || !!exchangeSelection.right}
            >
              To Right
            </button>
          </div>
        )}
        {gameState.phaseStatus === 'WAITING_DRAGON_SELECTION' && gameState.turn === myIndex && (
          <div className="dragon-controls">
            <button
              className="btn-game btn-dragon-give"
              onClick={() => handleSelectDragonReceiver(false)}
            >
              Give Dragon to Left ({getPlayerAt(3)?.name})
            </button>
            <button
              className="btn-game btn-dragon-give"
              onClick={() => handleSelectDragonReceiver(true)}
            >
              Give Dragon to Right ({getPlayerAt(1)?.name})
            </button>
          </div>
        )}
      </div>
      {scoreModalType && (
        <ScoreModal
          scoresHistory={gameState.scoresHistory}
          players={gameState.players}
          type={scoreModalType}
          onClose={() => setScoreModalType(null)}
        />
      )}
    </div>
  );
};

export default TichuPage;
