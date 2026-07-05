package com.icube.sim.tichu.games.hanabi.cards;

import com.icube.sim.tichu.games.hanabi.HanabiRule;
import com.icube.sim.tichu.games.hanabi.RainbowMode;
import lombok.Getter;

import java.util.HashSet;
import java.util.Set;

/**
 * A card slot in a player's hand. Holds the real card plus the accumulated clue knowledge
 * that has been communicated about it. The owner never sees {@link #card}; everyone else does.
 */
@Getter
public class HeldCard {
    private final HanabiCard card;
    private final Set<HanabiColor> positiveColorClues = new HashSet<>();
    private final Set<HanabiColor> negativeColorClues = new HashSet<>();
    private final Set<Integer> positiveValueClues = new HashSet<>();
    private final Set<Integer> negativeValueClues = new HashSet<>();

    public HeldCard(HanabiCard card) {
        this.card = card;
    }

    public boolean applyClue(Clue clue, HanabiRule rule) {
        var matched = matches(clue, rule);
        switch (clue) {
            case ColorClue c -> (matched ? positiveColorClues : negativeColorClues).add(c.color());
            case ValueClue v -> (matched ? positiveValueClues : negativeValueClues).add(v.value());
        }
        return matched;
    }

    /**
     * Whether this card is touched by a clue. Black is colorless and is only ever touched by value
     * hints. Rainbow depends on the mode: in {@link RainbowMode#WILDCARD} it counts as every color
     * (touched by any color hint); otherwise it is its own sixth color (touched only by a rainbow hint).
     */
    boolean matches(Clue clue, HanabiRule rule) {
        return switch (clue) {
            case ColorClue colorClue -> {
                if (card.color() == HanabiColor.BLACK) {
                    yield false;
                } else if (card.color() == HanabiColor.RAINBOW) {
                    yield rule.rainbowMode() == RainbowMode.WILDCARD || colorClue.color() == HanabiColor.RAINBOW;
                } else {
                    yield card.color() == colorClue.color();
                }
            }
            case ValueClue valueClue -> card.value() == valueClue.value();
        };
    }
}
