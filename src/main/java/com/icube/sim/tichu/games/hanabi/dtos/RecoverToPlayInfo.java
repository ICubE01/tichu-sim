package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.BonusEffect;
import org.jspecify.annotations.Nullable;

/**
 * A recover-to-play bonus was resolved: the completer ({@code playerId}) picked a discard at
 * {@code index} and placed it straight onto its firework, then drew a card. When the placed card
 * completed the stack, {@code fireworkCompleted} is true and {@code bonusEffect} carries any newly
 * revealed tile. {@code drawnCard} is masked (null card) for the completer.
 */
public record RecoverToPlayInfo(
        long playerId,
        int index,
        HanabiCardDto playedCard,
        boolean fireworkCompleted,
        @Nullable BonusEffect bonusEffect,
        @Nullable HanabiCardDto drawnCard
) {
}
