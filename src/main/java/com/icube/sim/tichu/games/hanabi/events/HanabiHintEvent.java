package com.icube.sim.tichu.games.hanabi.events;

import com.icube.sim.tichu.games.hanabi.cards.Clue;
import lombok.Getter;

import java.util.List;

/**
 * A hint was given. Carries who hinted whom, the clue, and which of the target's card positions
 * it touched.
 */
@Getter
public class HanabiHintEvent extends HanabiEvent {
    private final long fromId;
    private final long targetId;
    private final Clue clue;
    private final List<Integer> matchedIndexes;

    public HanabiHintEvent(long fromId, long targetId, Clue clue, List<Integer> matchedIndexes) {
        this.fromId = fromId;
        this.targetId = targetId;
        this.clue = clue;
        this.matchedIndexes = matchedIndexes;
    }
}
