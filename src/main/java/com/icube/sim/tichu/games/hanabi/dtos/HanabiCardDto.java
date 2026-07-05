package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;
import org.jspecify.annotations.Nullable;

public record HanabiCardDto(@Nullable HanabiColor color, @Nullable Integer value) {
}
