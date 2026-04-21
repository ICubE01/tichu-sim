import { MouseEventHandler } from "react";
import { PlayerIndex } from "@/games/tichu/types.ts";
import { Player } from "@/games/tichu/domain/Player.ts";
import { ExchangeMessage } from "@/games/tichu/dtos/ExchangeMessage.ts";
import { CardMapper } from "@/games/tichu/mappers/CardMapper.ts";
import CardView from "@/games/tichu/CardView.tsx";

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
                    {ex.gave ?
                      <CardView card={CardMapper.toCard(ex.gave)}/> :
                      <div className="card card-placeholder">?</div>}
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
                    {ex.received ?
                      <CardView card={CardMapper.toCard(ex.received)}/> :
                      <div className="card card-placeholder">?</div>}
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

export default ExchangeResultModal;
