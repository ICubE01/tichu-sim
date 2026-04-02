package com.icube.sim.tichu.games.tichu.tricks;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.DogCard;

import java.util.List;

public class DogTrick extends Trick {
    public DogTrick(int playerIndex, List<Card> cards) {
        super(playerIndex, cards);
        assert isDogTrick(cards);
    }

    public static boolean isDogTrick(List<Card> cards) {
        return cards.size() == 1 && cards.getFirst() instanceof DogCard;
    }

    @Override
    public TrickType getType() {
        return TrickType.DOG;
    }

    @Override
    public boolean canCoverUp(Trick other) {
        return false;
    }

    @Override
    public boolean canPlayWishCardAfter(int wish, List<Card> hand) {
        return false;
    }
}
