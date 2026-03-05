package com.icube.sim.tichu.games.tichu.dtos;

import com.icube.sim.tichu.games.tichu.cards.CardSuit;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

@NoArgsConstructor
@Data
public class CardDto {
    private CardType type;
    @Nullable
    private CardSuit suit;
    @Nullable
    private Integer rank;

    public CardDto(CardType type) {
        this(type, null, null);
    }

    public CardDto(CardType type, @Nullable CardSuit suit, @Nullable Integer rank) {
        this.type = type;
        this.suit = suit;
        this.rank = rank;
    }
}
