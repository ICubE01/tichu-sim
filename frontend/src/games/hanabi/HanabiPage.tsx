import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from "@/useAuth.tsx";
import { Stomp } from "@/useStomp.tsx";
import { ChatMessage } from "@/types.ts";
import {
  BonusEffect,
  CardViewDto,
  ClueType,
  FireworkDto,
  HanabiCardDto,
  HanabiColor,
  HanabiDto,
  PlayerDto,
} from "@/games/hanabi/dtos/HanabiDto.ts";
import { HanabiMessage, HanabiMessageType } from "@/games/hanabi/dtos/HanabiMessage.ts";
import { applyDelta } from "@/games/hanabi/domain/applyDelta.ts";
import { RainbowMode } from "@/games/hanabi/domain/HanabiRule.ts";
import styles from './HanabiPage.module.css';

const COLOR_LABEL: Record<HanabiColor, string> = {
  [HanabiColor.WHITE]: '하양',
  [HanabiColor.RED]: '빨강',
  [HanabiColor.BLUE]: '파랑',
  [HanabiColor.YELLOW]: '노랑',
  [HanabiColor.GREEN]: '초록',
  [HanabiColor.RAINBOW]: '무지개',
  [HanabiColor.BLACK]: '검정',
};

const BONUS_LABEL: Record<BonusEffect, string> = {
  [BonusEffect.GAIN_CLUE]: '힌트 토큰 획득',
  [BonusEffect.REPAIR_AND_CLUE]: '실수 복구 + 힌트 토큰',
  [BonusEffect.FREE_COLOR_HINT]: '무료 색깔 힌트',
  [BonusEffect.FREE_VALUE_HINT]: '무료 숫자 힌트',
  [BonusEffect.RECOVER_TO_DECK]: '버린 카드를 덱으로',
  [BonusEffect.RECOVER_TO_PLAY]: '버린 카드를 즉시 플레이',
};

const colorClass = (color: HanabiColor | null) => (color === null ? '' : styles[`color_${color}`] ?? '');

const COLOR_ORDER = Object.values(HanabiColor);
// A discard is always a real card, but the DTO allows a masked one; sort those to the end.
const colorRank = (color: HanabiColor | null) => (color === null ? COLOR_ORDER.length : COLOR_ORDER.indexOf(color));

// Mirrors HanabiColor.isDescending(): the black stack builds 5..1, so its discards read that way too.
const isDescendingColor = (color: HanabiColor | null) => color === HanabiColor.BLACK;

const VALUES = [1, 2, 3, 4, 5];

// Mirrors HeldCard.matches on the backend: black is never touched by a color clue, and rainbow is
// touched by every color clue in wildcard mode but only by a rainbow clue otherwise.
const colorMatchesClue = (color: HanabiColor, clueColor: HanabiColor, rainbowMode: RainbowMode) => {
  if (color === HanabiColor.BLACK) {
    return false;
  }
  if (color === HanabiColor.RAINBOW) {
    return rainbowMode === RainbowMode.WILDCARD || clueColor === HanabiColor.RAINBOW;
  }
  return color === clueColor;
};

// A color is still possible when it would have produced exactly the clues this card received:
// touched by every positive clue, untouched by every negative one. Negative clues carry real
// information, which is the whole point of showing this.
const possibleColors = (view: CardViewDto, activeColors: HanabiColor[], rainbowMode: RainbowMode) =>
  activeColors.filter(color =>
    view.positiveColors.every(clue => colorMatchesClue(color, clue, rainbowMode))
    && view.negativeColors.every(clue => !colorMatchesClue(color, clue, rainbowMode)));

const possibleValues = (view: CardViewDto) =>
  VALUES.filter(value =>
    view.positiveValues.every(clue => clue === value) && !view.negativeValues.includes(value));

const compareDiscards = (a: HanabiCardDto, b: HanabiCardDto) =>
  colorRank(a.color) - colorRank(b.color)
  || (isDescendingColor(a.color)
    ? (b.value ?? 0) - (a.value ?? 0)
    : (a.value ?? 0) - (b.value ?? 0));

const HanabiPage = ({ roomId, stomp, chatMessages, onGameEnd }: {
  roomId: string,
  stomp: Stomp,
  chatMessages: ChatMessage[],
  onGameEnd: () => void,
}) => {
  const { user } = useAuth();
  // Every hook below has to run unconditionally, so the null check cannot happen here. The hooks
  // read this instead of `user`, and rendering bails out once they have all been called.
  const userId = user?.id ?? null;

  const [dto, setDto] = useState<HanabiDto | null>(null);
  const [hintTargetId, setHintTargetId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  // Only consulted by the narrow floating layout; the wide sidebar is always shown.
  const [chatOpen, setChatOpen] = useState(false);

  // Kept in a ref so the subscription below never has to resubscribe to pick up a newer closure.
  // Assigned in an effect rather than during render, which is not safe to do to a ref.
  const handleMessageRef = useRef<(message: HanabiMessage) => void>(() => {});
  useEffect(() => {
    handleMessageRef.current = (message: HanabiMessage) => {
      if (message.type === HanabiMessageType.STATE || message.type === HanabiMessageType.END) {
        // Full-state snapshots (initial load, game start, game end) replace local state outright.
        setDto(message.data as HanabiDto);
      } else {
        // Per-action deltas are folded onto the last known state.
        setDto(prev => (prev === null ? prev : applyDelta(prev, message)));
      }
    };
  });

  useEffect(() => {
    if (userId === null) {
      return;
    }

    const callback = (message: HanabiMessage) => handleMessageRef.current(message);
    const destination = `/user/${userId}/queue/game/hanabi`;
    stomp.subscribe(destination, callback);
    stomp.publish(`/app/rooms/${roomId}/game/hanabi/get`, {});
    return () => stomp.unsubscribe(destination, callback);
  }, [roomId, userId, stomp]);

  const giveHint = useCallback((targetId: number, clueType: ClueType, color: HanabiColor | null, value: number | null) => {
    stomp.publish(`/app/rooms/${roomId}/game/hanabi/hint`, { targetId, clueType, color, value });
  }, [roomId, stomp]);

  const playCard = useCallback((index: number) => {
    stomp.publish(`/app/rooms/${roomId}/game/hanabi/play`, { index });
  }, [roomId, stomp]);

  const discardCard = useCallback((index: number) => {
    stomp.publish(`/app/rooms/${roomId}/game/hanabi/discard`, { index });
  }, [roomId, stomp]);

  const resolveBonus = useCallback((payload: object) => {
    stomp.publish(`/app/rooms/${roomId}/game/hanabi/resolve-bonus`, payload);
  }, [roomId, stomp]);

  if (user === null) {
    return null;
  }

  const sendChatMessage = () => {
    if (chatInput.trim() === '') {
      return;
    }
    stomp.publish(`/app/rooms/${roomId}/chat`, { message: chatInput });
    setChatInput('');
  };

  if (dto === null) {
    return <div className={styles.loading}>게임을 불러오는 중...</div>;
  }

  // The backend sends currentTurnIndex and per-firework counts; the current player and score are derived.
  const currentPlayerId = dto.players[dto.currentTurnIndex]?.playerId;
  const score = dto.fireworks.reduce((sum, fw) => sum + fw.playCount, 0);

  const myTurn = currentPlayerId === user.id && dto.pendingBonus === null && !dto.ended;
  const canHint = myTurn && dto.clueTokens > 0;
  const canDiscard = myTurn && dto.clueTokens < dto.maxClueTokens;
  const bonusIsMine = dto.pendingBonus !== null && dto.pendingBonus.playerId === user.id;

  const me = dto.players.find(p => p.playerId === user.id);
  // Others are shown in turn order starting from the player after me, so the row reads in the
  // order they will act. A spectator (not seated) sees the raw seat order.
  const myIndex = dto.players.findIndex(p => p.playerId === user.id);
  const others = myIndex < 0
    ? dto.players
    : Array.from({ length: dto.players.length - 1 }, (_, i) => dto.players[(myIndex + 1 + i) % dto.players.length]);
  const playerNameById = (id: number) => dto.players.find(p => p.playerId === id)?.name ?? '?';
  // Display copy only. BonusBanner keeps the raw pile, since a recovery is resolved server-side
  // by the card's position in it.
  const sortedDiscardPile = [...dto.discardPile].sort(compareDiscards);
  // Every color in play, in stack order. A card can only be one of these.
  const activeColors = dto.fireworks.map(fw => fw.color);
  // Every active color is hintable except black (colorless). Rainbow can be named only in the
  // sixth-color modes; in wildcard mode it counts as all colors and is never named directly.
  const hintableColors = activeColors
    .filter(color => color !== HanabiColor.BLACK)
    .filter(color => color !== HanabiColor.RAINBOW || dto.rule.rainbowMode !== RainbowMode.WILDCARD);

  return (
    <div className={`${styles.container} content`}>
      <div className={styles.main}>
      <div className={styles.statusBar}>
        <span className={styles.token}>🔵 힌트 {dto.clueTokens}/{dto.maxClueTokens}</span>
        <span className={styles.token}>🧨 실수 {dto.maxFuseTokens - dto.fuseTokens}/{dto.maxFuseTokens}</span>
        <span className={styles.token}>🎴 덱 {dto.deckSize}</span>
        <span className={styles.token}>⭐ 점수 {score}</span>
        {dto.finalTurnsRemaining !== null && !dto.ended && (
          <span className={styles.lastRound}>마지막 라운드 (남은 턴 {dto.finalTurnsRemaining})</span>
        )}
        <span className={styles.turnInfo}>
          {dto.ended ? '게임 종료' : `${playerNameById(currentPlayerId)} 의 차례`}
        </span>
      </div>

      <div className={styles.fireworks}>
        {dto.fireworks.map((fw: FireworkDto) => (
          <Stack key={fw.color} firework={fw} />
        ))}
      </div>

      <div className={styles.players}>
        {others.map((player: PlayerDto) => (
          <div
            key={player.playerId}
            className={`${styles.playerArea} ${currentPlayerId === player.playerId ? styles.activePlayer : ''}`}
          >
            <div className={styles.playerHeader}>
              <span className={styles.playerName}>{player.name}</span>
              {canHint && (
                <button
                  className={styles.hintTargetButton}
                  onClick={() => setHintTargetId(hintTargetId === player.playerId ? null : player.playerId)}
                >
                  {hintTargetId === player.playerId ? '힌트 취소' : '힌트 주기'}
                </button>
              )}
            </div>
            <div className={styles.hand}>
              {player.cardViews.map((card, index) => (
                <OpponentCard
                  key={index}
                  card={card}
                  activeColors={activeColors}
                  rainbowMode={dto.rule.rainbowMode}
                />
              ))}
            </div>
            {canHint && hintTargetId === player.playerId && (
              <HintPicker colors={hintableColors} onHint={(type, color, value) => {
                giveHint(player.playerId, type, color, value);
                setHintTargetId(null);
              }} />
            )}
          </div>
        ))}
      </div>

      <div className={styles.myArea}>
        <div className={styles.playerHeader}>
          <span className={styles.playerName}>내 손패 {currentPlayerId === user.id && !dto.ended ? '(내 차례)' : ''}</span>
        </div>
        <div className={styles.hand}>
          {me?.cardViews.map((card, index) => (
            <MyCard
              key={index}
              card={card}
              canAct={myTurn}
              canDiscard={canDiscard}
              activeColors={activeColors}
              rainbowMode={dto.rule.rainbowMode}
              onPlay={() => playCard(index)}
              onDiscard={() => discardCard(index)}
            />
          ))}
        </div>
      </div>

      {dto.pendingBonus !== null && (
        <BonusBanner
          effect={dto.pendingBonus.effect}
          isMine={bonusIsMine}
          ownerName={playerNameById(dto.pendingBonus.playerId)}
          others={others}
          discardPile={dto.discardPile}
          colors={hintableColors}
          onResolve={resolveBonus}
        />
      )}

      <div className={styles.discardSection}>
        <strong>버린 카드 ({dto.discardPile.length})</strong>
        <div className={styles.discardPile}>
          {sortedDiscardPile.map((card: HanabiCardDto, index) => (
            <div key={index} className={`${styles.miniCard} ${colorClass(card.color)}`}>{card.value}</div>
          ))}
        </div>
      </div>

      {dto.ended && (
        <div className={styles.endOverlay}>
          <div className={styles.endModal}>
            <h2>{dto.exploded ? '💥 폭죽이 터졌습니다!' : '🎆 게임 종료'}</h2>
            <p className={styles.finalScore}>최종 점수: {score}</p>
            <button className={styles.leaveButton} onClick={() => onGameEnd()}>대기실로</button>
          </div>
        </div>
      )}
      </div>

      <button
        className={styles.chatToggle}
        onClick={() => setChatOpen(open => !open)}
      >
        {chatOpen ? '채팅 닫기' : '💬 채팅'}
      </button>

      <div className={`${styles.chatSection} ${chatOpen ? styles.open : ''}`}>
        <div className={styles.chatMessages}>
          {chatMessages.map((msg, index) => (
            <div key={index} className={styles.chatMessage}>
              <strong>{playerNameById(msg.userId)}:</strong> {msg.message}
            </div>
          ))}
        </div>
        <div className={styles.chatInputArea}>
          <input
            type="text"
            placeholder="메시지를 입력하세요..."
            value={chatInput}
            autoComplete="off"
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
          />
          <button onClick={sendChatMessage}>전송</button>
        </div>
      </div>
    </div>
  );
};

const Stack = ({ firework }: { firework: FireworkDto }) => (
  <div className={`${styles.stack} ${colorClass(firework.color)} ${firework.isComplete ? styles.complete : ''}`}>
    <span className={styles.stackLabel}>{COLOR_LABEL[firework.color]}</span>
    <span className={styles.stackValue}>{firework.topValue === 0 ? '-' : firework.topValue}</span>
  </div>
);

// The badge names a color only when the deduction leaves exactly one candidate, and marks it
// uncertain otherwise. In wildcard mode a lone 파랑 clue also touches 무지개, so it reads "파랑?";
// a second color clue rules 파랑 out and leaves 무지개 alone, which then reads plainly.
const clueColorText = (card: CardViewDto, activeColors: HanabiColor[], rainbowMode: RainbowMode) => {
  const candidates = possibleColors(card, activeColors, rainbowMode);
  const [confirmed] = candidates;
  if (confirmed !== undefined && candidates.length === 1) {
    return COLOR_LABEL[confirmed];
  }
  // Still ambiguous: name the clue the owner was actually given rather than listing candidates,
  // which the hover panel already does with more room.
  const [firstClue] = card.positiveColors;
  if (firstClue === undefined) {
    return '';
  }
  return `${COLOR_LABEL[firstClue]}?`;
};

const clueText = (card: CardViewDto, activeColors: HanabiColor[], rainbowMode: RainbowMode) => {
  const parts: string[] = [];
  const color = clueColorText(card, activeColors, rainbowMode);
  if (color !== '') {
    parts.push(color);
  }
  if (card.positiveValues.length > 0) {
    parts.push(card.positiveValues.join('/'));
  }
  return parts.join(' ');
};

const CANDIDATE_MARGIN = 8;

/**
 * Keeps the hover panel inside the window. CSS cannot know where the card sits, so the panel is
 * measured on hover and nudged sideways / flipped under the card as needed.
 */
const useCandidateClamp = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  const [below, setBelow] = useState(false);

  const clampIntoView = useCallback(() => {
    const panel = ref.current;
    if (panel === null) {
      return;
    }
    const rect = panel.getBoundingClientRect();
    // clientWidth, not window.innerWidth: innerWidth counts the scrollbar as usable space, which
    // leaves the panel's right edge parked underneath it.
    const viewportWidth = document.documentElement.clientWidth;

    // The rect already includes the shift in effect, so corrections accumulate onto it.
    if (rect.left < CANDIDATE_MARGIN) {
      setShift(current => current + CANDIDATE_MARGIN - rect.left);
    } else if (rect.right > viewportWidth - CANDIDATE_MARGIN) {
      setShift(current => current + viewportWidth - CANDIDATE_MARGIN - rect.right);
    }

    // Decided from the card's position and the panel's height, never from the panel's current
    // placement — otherwise flipping would change the input and the two states would oscillate.
    const card = panel.parentElement;
    if (card !== null) {
      setBelow(card.getBoundingClientRect().top - rect.height - CANDIDATE_MARGIN < CANDIDATE_MARGIN);
    }
  }, []);

  return { ref, shift, below, clampIntoView };
};

/** Everything the card's owner can still deduce about it, revealed on hover. */
const CardCandidates = ({ ref, shift, below, heading, card, activeColors, rainbowMode }: {
  ref: RefObject<HTMLDivElement | null>,
  shift: number,
  below: boolean,
  heading: string,
  card: CardViewDto,
  activeColors: HanabiColor[],
  rainbowMode: RainbowMode,
}) => (
  <div
    ref={ref}
    className={`${styles.cardCandidates} ${below ? styles.below : ''}`}
    style={{ transform: `translateX(calc(-50% + ${shift}px))` }}
  >
    <div className={styles.candidateHeading}>{heading}</div>
    <div className={styles.candidateRow}>
      <span className={styles.candidateLabel}>가능한 색깔</span>
      {possibleColors(card, activeColors, rainbowMode).map(color => (
        <span key={color} className={`${styles.candidateChip} ${colorClass(color)}`}>{COLOR_LABEL[color]}</span>
      ))}
    </div>
    <div className={styles.candidateRow}>
      <span className={styles.candidateLabel}>가능한 숫자</span>
      {possibleValues(card).map(value => (
        <span key={value} className={styles.candidateChip}>{value}</span>
      ))}
    </div>
  </div>
);

const OpponentCard = ({ card, activeColors, rainbowMode }: {
  card: CardViewDto,
  activeColors: HanabiColor[],
  rainbowMode: RainbowMode,
}) => {
  // The badge is always rendered, only hidden when there is no clue, so gaining a clue does not
  // re-center the value and shift it upward.
  const clue = clueText(card, activeColors, rainbowMode);
  const { ref, shift, below, clampIntoView } = useCandidateClamp();
  return (
    <div
      className={`${styles.card} ${card.card ? colorClass(card.card.color) : ''}`}
      onMouseEnter={clampIntoView}
    >
      <span className={styles.cardValue}>{card.card?.value ?? '?'}</span>
      <span className={`${styles.clueBadge} ${clue ? '' : styles.badgePlaceholder}`}>
        {clue || '\u00A0'}
      </span>
      <CardCandidates
        ref={ref}
        shift={shift}
        below={below}
        heading="알려진 정보"
        card={card}
        activeColors={activeColors}
        rainbowMode={rainbowMode}
      />
    </div>
  );
};

const MyCard = ({ card, canAct, canDiscard, activeColors, rainbowMode, onPlay, onDiscard }: {
  card: CardViewDto,
  canAct: boolean,
  canDiscard: boolean,
  activeColors: HanabiColor[],
  rainbowMode: RainbowMode,
  onPlay: () => void,
  onDiscard: () => void,
}) => {
  const { ref, shift, below, clampIntoView } = useCandidateClamp();
  // The actions sit in the slot beneath the card rather than inside it, so the card keeps the same
  // box on every turn instead of growing when it becomes actionable. The candidates panel stays
  // inside the card: it is positioned against it, and the clamp measures from it.
  return (
    <div className={styles.cardSlot}>
      <div className={`${styles.card} ${styles.cardBack}`} onMouseEnter={clampIntoView}>
        <span className={styles.cardClue}>{clueText(card, activeColors, rainbowMode) || '???'}</span>
        <CardCandidates
          ref={ref}
          shift={shift}
          below={below}
          heading="알려진 정보"
          card={card}
          activeColors={activeColors}
          rainbowMode={rainbowMode}
        />
      </div>
      {canAct && (
        <div className={styles.cardActions}>
          <button onClick={onPlay}>내기</button>
          <button onClick={onDiscard} disabled={!canDiscard}>버리기</button>
        </div>
      )}
    </div>
  );
};

const HintPicker = ({ colors, only, onHint }: {
  colors: HanabiColor[],
  only?: ClueType,
  onHint: (type: ClueType, color: HanabiColor | null, value: number | null) => void,
}) => (
  <div className={styles.hintPicker}>
    {only !== ClueType.VALUE && (
      <div className={styles.hintRow}>
        {colors.map(color => (
          <button
            key={color}
            className={`${styles.hintChip} ${colorClass(color)}`}
            onClick={() => onHint(ClueType.COLOR, color, null)}
          >
            {COLOR_LABEL[color]}
          </button>
        ))}
      </div>
    )}
    {only !== ClueType.COLOR && (
      <div className={styles.hintRow}>
        {[1, 2, 3, 4, 5].map(value => (
          <button
            key={value}
            className={styles.hintChip}
            onClick={() => onHint(ClueType.VALUE, null, value)}
          >
            {value}
          </button>
        ))}
      </div>
    )}
  </div>
);

/**
 * The pending bonus, shown to everyone: its owner gets the controls to resolve it, while the rest of
 * the table sees only what was drawn and whose turn it is to act. Note this covers just the four
 * effects that pend — GAIN_CLUE and REPAIR_AND_CLUE apply the moment they are drawn and never reach
 * this state.
 */
const BonusBanner = ({ effect, isMine, ownerName, others, discardPile, colors, onResolve }: {
  effect: BonusEffect,
  isMine: boolean,
  ownerName: string,
  others: PlayerDto[],
  discardPile: HanabiCardDto[],
  colors: HanabiColor[],
  onResolve: (payload: object) => void,
}) => {
  const [targetId, setTargetId] = useState<number | null>(null);
  const isHint = effect === BonusEffect.FREE_COLOR_HINT || effect === BonusEffect.FREE_VALUE_HINT;
  const isRecover = effect === BonusEffect.RECOVER_TO_DECK || effect === BonusEffect.RECOVER_TO_PLAY;

  return (
    <div className={styles.bonusBanner}>
      <strong>{isMine ? '보너스' : `${ownerName} 의 보너스`}: {BONUS_LABEL[effect]}</strong>
      {!isMine && (
        <div className={styles.bonusBody}>
          <span className={styles.bonusWaiting}>{ownerName} 이(가) 해결하기를 기다리는 중...</span>
        </div>
      )}
      {isMine && isHint && (
        <div className={styles.bonusBody}>
          <div className={styles.hintRow}>
            {others.map(p => (
              <button
                key={p.playerId}
                className={`${styles.hintChip} ${targetId === p.playerId ? styles.selected : ''}`}
                onClick={() => setTargetId(p.playerId)}
              >
                {p.name}
              </button>
            ))}
          </div>
          {targetId !== null && (
            <HintPicker
              colors={colors}
              only={effect === BonusEffect.FREE_COLOR_HINT ? ClueType.COLOR : ClueType.VALUE}
              onHint={(type, color, value) => onResolve({
                targetId,
                clueType: type,
                color,
                value,
              })}
            />
          )}
        </div>
      )}
      {isMine && isRecover && (
        <div className={styles.bonusBody}>
          <span>되살릴 버린 카드를 선택하세요</span>
          <div className={styles.discardPile}>
            {discardPile.map((card, index) => (
              <button
                key={index}
                className={`${styles.miniCard} ${colorClass(card.color)}`}
                onClick={() => onResolve({ discardIndex: index })}
              >
                {card.value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HanabiPage;
