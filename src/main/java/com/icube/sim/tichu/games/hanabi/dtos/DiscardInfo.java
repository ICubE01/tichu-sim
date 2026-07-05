package com.icube.sim.tichu.games.hanabi.dtos;

import org.jspecify.annotations.Nullable;

/**
 * A card was discarded and a replacement drawn. {@code drawnCard} is masked (null) for the
 * discarder, who does not see their own newly drawn card, and populated for everyone else.
 */
public record DiscardInfo(
        long playerId,
        int index,
        HanabiCardDto discardedCard,
        @Nullable HanabiCardDto drawnCard
) {
}
