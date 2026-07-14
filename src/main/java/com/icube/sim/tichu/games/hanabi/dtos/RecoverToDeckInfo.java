package com.icube.sim.tichu.games.hanabi.dtos;

import org.jspecify.annotations.Nullable;

/**
 * A recover-to-deck bonus was resolved: the completer ({@code playerId}) picked a discard, which was
 * shuffled back into the deck, and then drew a card. {@code drawnCard} is masked (null card) for the
 * completer.
 */
public record RecoverToDeckInfo(
        long playerId,
        HanabiCardDto recoveredCard,
        @Nullable HanabiCardDto drawnCard
) {
}
