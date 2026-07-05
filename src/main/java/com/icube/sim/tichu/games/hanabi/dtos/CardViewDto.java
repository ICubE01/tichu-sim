package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;

import java.util.List;

/**
 * A card as seen by one viewer. {@code card} is null when the viewer owns the card (they may not
 * see their own cards); the clue lists always reflect the information communicated about it.
 */
public record CardViewDto(
        HanabiCardDto card,
        List<HanabiColor> positiveColors,
        List<HanabiColor> negativeColors,
        List<Integer> positiveValues,
        List<Integer> negativeValues
) {
}
