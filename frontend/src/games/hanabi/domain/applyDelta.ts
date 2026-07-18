import { BonusEffect, CardViewDto, ClueType, FireworkDto, HanabiCardDto, HanabiColor, HanabiDto, PlayerDto } from "@/games/hanabi/dtos/HanabiDto.ts";
import {
  DiscardInfo,
  FreeHintInfo,
  HanabiMessage,
  HanabiMessageType,
  HintInfo,
  PlayInfo,
  RecoverToDeckInfo,
  RecoverToPlayInfo,
} from "@/games/hanabi/dtos/HanabiMessage.ts";

const COMPLETE_COUNT = 5;

/**
 * Applies a per-action delta message to the current game state and returns the next state.
 *
 * The backend broadcasts only what an action changed (see the `*Info` payloads); the resulting scalar
 * counters — clue/fuse tokens, deck size, current turn, final-turn countdown, pending bonus — are not
 * transmitted. This reducer reconstructs them by mirroring the server's engine (`Hanabi.java`) exactly,
 * so that folding the deltas over the last full `STATE` snapshot reproduces the authoritative state.
 *
 * `STATE`/`END` carry a full snapshot and are handled by the caller; any non-delta message is returned
 * unchanged.
 */
export const applyDelta = (dto: HanabiDto, message: HanabiMessage): HanabiDto => {
  const next = structuredClone(dto);
  switch (message.type) {
    case HanabiMessageType.HINT: {
      const info = message.data as HintInfo;
      next.clueTokens -= 1;
      applyClueToHand(next, info.targetId, info.clueType, info.color, info.value, info.matchedIndices);
      advanceTurn(next);
      break;
    }
    case HanabiMessageType.DISCARD: {
      const info = message.data as DiscardInfo;
      removeHandCard(next, info.playerId, info.index);
      next.discardPile.push(info.discardedCard);
      if (next.clueTokens < next.maxClueTokens) {
        next.clueTokens += 1;
      }
      drawTo(next, info.playerId, info.drawnCard);
      advanceTurn(next);
      break;
    }
    case HanabiMessageType.PLAY: {
      const info = message.data as PlayInfo;
      removeHandCard(next, info.playerId, info.index);
      if (info.success) {
        playOntoFirework(next, info.playedCard);
        if (info.fireworkCompleted) {
          applyFireworkCompleteBonus(next, info.playerId, info.bonusEffect);
        }
      } else {
        next.discardPile.push(info.playedCard);
        next.fuseTokens -= 1;
      }
      drawTo(next, info.playerId, info.drawnCard);
      if (next.fuseTokens <= 0) {
        next.exploded = true;
        next.ended = true;
      } else {
        concludeTurn(next);
      }
      break;
    }
    case HanabiMessageType.RESOLVE_FREE_HINT: {
      const info = message.data as FreeHintInfo;
      applyClueToHand(next, info.targetId, info.clueType, info.color, info.value, info.matchedIndices);
      next.pendingBonus = null;
      drawTo(next, info.fromId, info.drawnCard);
      advanceTurn(next);
      break;
    }
    case HanabiMessageType.RESOLVE_RECOVER_TO_DECK: {
      const info = message.data as RecoverToDeckInfo;
      removeFromDiscard(next, info.recoveredCard);
      next.deckSize += 1;
      next.pendingBonus = null;
      drawTo(next, info.playerId, info.drawnCard);
      advanceTurn(next);
      break;
    }
    case HanabiMessageType.RESOLVE_RECOVER_TO_PLAY: {
      const info = message.data as RecoverToPlayInfo;
      next.discardPile.splice(info.index, 1);
      playOntoFirework(next, info.playedCard);
      next.pendingBonus = null;
      if (info.fireworkCompleted) {
        applyFireworkCompleteBonus(next, info.playerId, info.bonusEffect);
      }
      drawTo(next, info.playerId, info.drawnCard);
      concludeTurn(next);
      break;
    }
    default:
      // STATE / END / START / SET_RULE are not deltas.
      return dto;
  }
  return next;
};

// ----- Turn flow -----

const advanceTurn = (dto: HanabiDto): void => {
  if (dto.ended) {
    return;
  }
  if (dto.finalTurnsRemaining !== null) {
    dto.finalTurnsRemaining -= 1;
    if (dto.finalTurnsRemaining <= 0) {
      dto.ended = true;
      return;
    }
  } else if (dto.deckSize === 0) {
    dto.finalTurnsRemaining = dto.players.length;
  }
  dto.currentTurnIndex = (dto.currentTurnIndex + 1) % dto.players.length;
};

const concludeTurn = (dto: HanabiDto): void => {
  if (dto.fireworks.every(fw => fw.isComplete)) {
    dto.ended = true;
    return;
  }
  if (dto.pendingBonus !== null) {
    return;
  }
  advanceTurn(dto);
};

// ----- Fireworks & bonuses -----

const nextValue = (fw: FireworkDto): number => {
  if (fw.isComplete) {
    return -1;
  }
  return fw.descending ? COMPLETE_COUNT - fw.playCount : fw.playCount + 1;
};

const canPlay = (fw: FireworkDto, card: HanabiCardDto): boolean =>
  card.color === fw.color && card.value === nextValue(fw);

const playOntoFirework = (dto: HanabiDto, card: HanabiCardDto): void => {
  const fw = dto.fireworks.find(f => f.color === card.color);
  if (fw === undefined) {
    return;
  }
  fw.playCount += 1;
  fw.isComplete = fw.playCount === COMPLETE_COUNT;
  fw.topValue = fw.descending ? COMPLETE_COUNT + 1 - fw.playCount : fw.playCount;
};

const gainClue = (dto: HanabiDto): void => {
  if (dto.clueTokens < dto.maxClueTokens) {
    dto.clueTokens += 1;
  }
};

const noDiscardIsPlayable = (dto: HanabiDto): boolean =>
  !dto.discardPile.some(card => {
    const fw = dto.fireworks.find(f => f.color === card.color);
    return fw !== undefined && canPlay(fw, card);
  });

/** Mirrors `Hanabi.onFireworkComplete` + `applyBonus`: apply immediate effects, or pend one for the player. */
const applyFireworkCompleteBonus = (dto: HanabiDto, playerId: number, effect: BonusEffect | null): void => {
  if (effect === null) {
    gainClue(dto);
    return;
  }
  switch (effect) {
    case BonusEffect.GAIN_CLUE:
      gainClue(dto);
      break;
    case BonusEffect.REPAIR_AND_CLUE:
      if (dto.fuseTokens < dto.maxFuseTokens) {
        dto.fuseTokens += 1;
      }
      gainClue(dto);
      break;
    case BonusEffect.FREE_COLOR_HINT:
    case BonusEffect.FREE_VALUE_HINT:
      dto.pendingBonus = { effect, playerId };
      break;
    case BonusEffect.RECOVER_TO_DECK:
      if (dto.discardPile.length === 0) {
        break;
      }
      if (dto.deckSize === 0 && noDiscardIsPlayable(dto)) {
        break;
      }
      dto.pendingBonus = { effect, playerId };
      break;
    case BonusEffect.RECOVER_TO_PLAY:
      if (dto.discardPile.length === 0 || noDiscardIsPlayable(dto)) {
        break;
      }
      dto.pendingBonus = { effect, playerId };
      break;
  }
};

// ----- Hands & cards -----

const findPlayer = (dto: HanabiDto, playerId: number): PlayerDto | undefined =>
  dto.players.find(p => p.playerId === playerId);

const removeHandCard = (dto: HanabiDto, playerId: number, index: number): void => {
  findPlayer(dto, playerId)?.cardViews.splice(index, 1);
};

/** A present `drawnCard` (even a masked `{null,null}`) means a card was drawn onto the player's hand. */
const drawTo = (dto: HanabiDto, playerId: number, drawnCard: HanabiCardDto | null): void => {
  if (drawnCard === null) {
    return;
  }
  const player = findPlayer(dto, playerId);
  if (player === undefined) {
    return;
  }
  player.cardViews.push({
    card: drawnCard,
    positiveColors: [],
    negativeColors: [],
    positiveValues: [],
    negativeValues: [],
  });
  dto.deckSize -= 1;
};

const removeFromDiscard = (dto: HanabiDto, card: HanabiCardDto): void => {
  const index = dto.discardPile.findIndex(c => c.color === card.color && c.value === card.value);
  if (index >= 0) {
    dto.discardPile.splice(index, 1);
  }
};

const pushUnique = <T>(list: T[], item: T): void => {
  if (!list.includes(item)) {
    list.push(item);
  }
};

/** Records the clue knowledge on the target's cards, using the server-computed matched indices. */
const applyClueToHand = (
  dto: HanabiDto,
  targetId: number,
  clueType: ClueType,
  color: HanabiColor | null,
  value: number | null,
  matchedIndices: number[],
): void => {
  const target = findPlayer(dto, targetId);
  if (target === undefined) {
    return;
  }
  const matched = new Set(matchedIndices);
  target.cardViews.forEach((cv: CardViewDto, i: number) => {
    if (clueType === ClueType.COLOR) {
      if (color === null) {
        return;
      }
      pushUnique(matched.has(i) ? cv.positiveColors : cv.negativeColors, color);
    } else {
      if (value === null) {
        return;
      }
      pushUnique(matched.has(i) ? cv.positiveValues : cv.negativeValues, value);
    }
  });
};
