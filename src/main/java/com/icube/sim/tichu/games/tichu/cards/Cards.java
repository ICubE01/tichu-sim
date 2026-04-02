package com.icube.sim.tichu.games.tichu.cards;

import java.util.ArrayList;
import java.util.List;

public class Cards {
    public static List<Card> getDeck() {
        var cards = new ArrayList<Card>(56);

        for (CardSuit suit : CardSuit.values()) {
            for (int rank = 2; rank <= 14; rank++) {
                cards.add(new StandardCard(suit, rank));
            }
        }

        cards.add(new SparrowCard());
        cards.add(new PhoenixCard());
        cards.add(new DragonCard());
        cards.add(new DogCard());

        assert cards.size() == 56;

        return cards;
    }

    public static boolean areDistinct(List<Card> cards) {
        return cards.stream().distinct().count() == cards.size();
    }

    public static boolean containsPhoenix(List<Card> cards) {
        return cards.stream().anyMatch(card -> card instanceof PhoenixCard);
    }

    public static boolean containsSparrow(List<Card> cards) {
        return cards.stream().anyMatch(card -> card instanceof SparrowCard);
    }

    public static List<Integer> extractStandardCardRanks(List<Card> cards) {
        return cards.stream()
                .filter(card -> card instanceof StandardCard)
                .map(card -> ((StandardCard) card).rank())
                .toList();
    }

    public static List<StandardCard> extractStandardCards(List<Card> cards) {
        return cards.stream()
                .filter(card -> card instanceof StandardCard)
                .map(card -> (StandardCard) card)
                .toList();
    }

    public static boolean haveSameSuit(List<StandardCard> cards) {
        assert !cards.isEmpty();
        return cards.stream().map(StandardCard::suit).distinct().count() == 1;
    }

    public static boolean containsWishCard(List<Card> cards, int wish) {
        return extractStandardCards(cards).stream().anyMatch(card -> card.rank() == wish);
    }
}
