package com.icube.sim.tichu.games.hanabi;

import com.icube.sim.tichu.games.hanabi.cards.HeldCard;
import com.icube.sim.tichu.rooms.Member;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

public class HanabiPlayer {
    @Getter
    private final long id;
    @Getter
    private final String name;
    private final List<HeldCard> hand = new ArrayList<>();

    public HanabiPlayer(Member member) {
        this.id = member.getId();
        this.name = member.getName();
    }

    /** Returns the live hand (same {@link HeldCard} references), so clue mutations persist. */
    public List<HeldCard> getHand() {
        return List.copyOf(hand);
    }

    public int getHandSize() {
        return hand.size();
    }

    public void add(HeldCard card) {
        hand.add(card);
    }

    public HeldCard removeCardAt(int index) {
        return hand.remove(index);
    }
}
