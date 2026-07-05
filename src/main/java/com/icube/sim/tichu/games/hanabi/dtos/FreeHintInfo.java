package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.cards.ClueType;
import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;
import org.jspecify.annotations.Nullable;

import java.util.List;

/**
 * A free-hint bonus was resolved: the completer ({@code fromId}) gave a color or value hint to
 * another player and then drew a card. {@code drawnCard} is masked (null card) for the completer.
 */
public record FreeHintInfo(
        long fromId,
        long targetId,
        ClueType clueType,
        @Nullable HanabiColor color,
        @Nullable Integer value,
        List<Integer> matchedIndices,
        @Nullable HanabiCardDto drawnCard
) {
}
