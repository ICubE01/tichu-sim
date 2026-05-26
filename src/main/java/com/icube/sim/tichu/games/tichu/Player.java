package com.icube.sim.tichu.games.tichu;

import com.icube.sim.tichu.games.tichu.cards.Card;
import com.icube.sim.tichu.games.tichu.cards.Cards;
import com.icube.sim.tichu.games.tichu.tricks.*;
import com.icube.sim.tichu.rooms.Member;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

public class Player {
    @Getter
    private final long id;
    @Getter
    private final String name;
    @Getter
    private final Team team;
    private List<Card> hand;
    private List<Card> scoreCards;

    public Player(Member member, Team team) {
        this.id = member.getId();
        this.name = member.getName();
        this.team = team;
        this.hand = null;
        this.scoreCards = null;
    }

    public List<Card> getHand() {
        return List.copyOf(hand);
    }

    public int getHandSize() {
        return hand.size();
    }

    public boolean hasCard(Card card) {
        return hand.contains(card);
    }

    public boolean doNotHaveSomeCards(List<Card> cards) {
        return !new HashSet<>(hand).containsAll(cards);
    }

    public boolean canPlayWishCard(int wish, @Nullable Trick prevTrick) {
        assert prevTrick == null || prevTrick.getType() != TrickType.DOG;

        if (!Cards.containsWishCard(hand, wish)) {
            return false;
        }
        if (prevTrick == null) {
            return true;
        }
        return prevTrick.canPlayWishCardAfter(wish, hand);
    }

    public void initFirstDraws(List<Card> cards) {
        assert cards.size() == 8;
        hand = new ArrayList<>(cards);
    }

    public void addSecondDraws(List<Card> cards) {
        assert cards.size() == 6;
        hand.addAll(cards);
    }

    public void exchange(List<Card> cardsGave, List<Card> cardsReceived) {
        hand.removeAll(cardsGave);
        hand.addAll(cardsReceived);

        scoreCards = new ArrayList<>();
    }

    public void playCards(List<Card> cards) {
        hand.removeAll(cards);
    }

    public void addScoreCards(List<Card> cards) {
        scoreCards.addAll(cards);
    }

    public int sumScore() {
        return scoreCards.stream().mapToInt(Card::score).sum();
    }

    public int sumScoreInHand() {
        return hand.stream().mapToInt(Card::score).sum();
    }

    public void clearCards() {
        hand = null;
        scoreCards = null;
    }
}
