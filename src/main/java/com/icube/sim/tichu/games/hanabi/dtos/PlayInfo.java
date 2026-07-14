package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.BonusEffect;
import org.jspecify.annotations.Nullable;

/**
 * A card was played. On success {@code firework} carries the stack's new top; on a misplay the card
 * went to the discard and a fuse was lost. {@code drawnCard} is masked (null) for the actor.
 * {@code pendingBonus} is present when completing a firework revealed a bonus tile awaiting resolution.
 */
public record PlayInfo(
        long playerId,
        int index,
        HanabiCardDto playedCard,
        boolean success,
        boolean fireworkCompleted,
        @Nullable BonusEffect bonusEffect,
        @Nullable HanabiCardDto drawnCard
) {
}
