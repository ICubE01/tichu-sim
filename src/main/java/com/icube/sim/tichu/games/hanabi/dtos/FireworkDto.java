package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;

public record FireworkDto(
        HanabiColor color,
        int playCount,
        boolean isComplete,
        int topValue,
        boolean descending
) {
}
