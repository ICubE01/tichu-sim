package com.icube.sim.tichu.games.tichu.dtos;

import com.icube.sim.tichu.games.tichu.tricks.TrickType;
import org.jspecify.annotations.Nullable;

import java.util.List;

public record TrickDto(
        int playerIndex,
        TrickType type,
        List<CardDto> cards,
        @Nullable Float rank,
        @Nullable Integer minRank,
        @Nullable Integer maxRank,
        @Nullable Float phoenixRank
) {
}
