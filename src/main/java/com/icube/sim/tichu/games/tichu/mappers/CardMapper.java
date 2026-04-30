package com.icube.sim.tichu.games.tichu.mappers;

import com.icube.sim.tichu.games.tichu.cards.*;
import com.icube.sim.tichu.games.tichu.dtos.CardDto;
import com.icube.sim.tichu.games.tichu.dtos.CardType;
import com.icube.sim.tichu.games.tichu.exceptions.CardMappingException;
import org.jspecify.annotations.Nullable;

import java.util.List;

public class CardMapper {
    public CardDto toDto(Card card) {
        return switch (card) {
            case StandardCard(CardSuit suit, int rank) -> new CardDto(CardType.STANDARD, suit, rank);
            case SparrowCard sparrowCard -> new CardDto(CardType.SPARROW);
            case PhoenixCard phoenixCard -> new CardDto(CardType.PHOENIX);
            case DragonCard dragonCard -> new CardDto(CardType.DRAGON);
            case DogCard dogCard -> new CardDto(CardType.DOG);
            case null, default -> throw new IllegalArgumentException("Invalid card type.");
        };
    }

    public Card toCard(CardDto cardDto) {
        return switch (cardDto.getType()) {
            case STANDARD -> {
                if (cardDto.getSuit() == null || cardDto.getRank() == null) {
                    throw new CardMappingException();
                } else if (cardDto.getRank() < 2 || cardDto.getRank() > 14) {
                    throw new CardMappingException();
                }
                yield new StandardCard(cardDto.getSuit(), cardDto.getRank());
            }
            case SPARROW -> new SparrowCard();
            case PHOENIX -> new PhoenixCard();
            case DRAGON -> new DragonCard();
            case DOG -> new DogCard();
        };
    }

    public @Nullable CardDto toDtoNullable(Card card) {
        return card == null ? null : toDto(card);
    }

    public @Nullable Card toCardNullable(CardDto cardDto) {
        return cardDto == null ? null : toCard(cardDto);
    }

    public List<CardDto> toDtos(List<Card> cards) {
        return cards.stream().map(this::toDto).toList();
    }

    public List<Card> toCards(List<CardDto> cardDtos) {
        return cardDtos.stream().map(this::toCard).toList();
    }
}

