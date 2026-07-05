package com.icube.sim.tichu.games.hanabi.events;

import com.icube.sim.tichu.games.hanabi.cards.Clue;
import com.icube.sim.tichu.games.hanabi.cards.HanabiCard;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.List;

@Getter
public class HanabiResolveFreeHintEvent extends HanabiEvent {
    private final long fromId;
    private final long targetId;
    private final Clue clue;
    private final List<Integer> matchedIndexes;
    @Nullable
    private final HanabiCard drawnCard;

    public HanabiResolveFreeHintEvent(long fromId,
                                      long targetId,
                                      Clue clue,
                                      List<Integer> matchedIndexes,
                                      @Nullable HanabiCard drawnCard) {
        this.fromId = fromId;
        this.targetId = targetId;
        this.clue = clue;
        this.matchedIndexes = matchedIndexes;
        this.drawnCard = drawnCard;
    }
}
