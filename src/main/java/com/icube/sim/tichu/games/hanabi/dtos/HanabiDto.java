package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.HanabiRule;
import org.jspecify.annotations.Nullable;

import java.util.List;

public record HanabiDto(
        HanabiRule rule,
        long myId,
        List<PlayerDto> players,
        int deckSize,
        List<FireworkDto> fireworks,
        List<HanabiCardDto> discardPile,
        int clueTokens,
        int maxClueTokens,
        int fuseTokens,
        int maxFuseTokens,
        int currentTurnIndex,
        @Nullable Integer finalTurnsRemaining,
        boolean exploded,
        boolean ended,
        @Nullable PendingBonusDto pendingBonus
) {
}
