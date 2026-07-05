package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.cards.ClueType;
import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;
import org.jspecify.annotations.Nullable;

import java.util.List;

/**
 * A hint was given. Fully public information (the touched card positions are shared knowledge).
 */
public record HintInfo(
        long fromId,
        long targetId,
        ClueType clueType,
        @Nullable HanabiColor color,
        @Nullable Integer value,
        List<Integer> matchedIndices
) {
}
