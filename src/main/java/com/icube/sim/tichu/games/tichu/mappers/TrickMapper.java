package com.icube.sim.tichu.games.tichu.mappers;

import com.icube.sim.tichu.games.tichu.dtos.TrickDto;
import com.icube.sim.tichu.games.tichu.tricks.*;

import java.util.List;

public class TrickMapper {
    private final CardMapper cardMapper = new CardMapper();

    public TrickDto toDto(Trick trick) {
        var builder = TrickDto.builder()
                .playerIndex(trick.getPlayerIndex())
                .type(trick.getType())
                .cards(cardMapper.toDtos(trick.getCards()));

        switch (trick) {
            case SingleTrick singleTrick -> {
                var rank = singleTrick.getRank();
                builder.rank(rank).phoenixRank(singleTrick.isPhoenixUsed() ? rank : null);
            }
            case PairTrick pairTrick -> {
                var rank = (float) pairTrick.getRank();
                builder.rank(rank).phoenixRank(pairTrick.isPhoenixUsed() ? rank : null);
            }
            case ThreeOfAKindTrick threeOfAKindTrick -> {
                var rank = (float) threeOfAKindTrick.getRank();
                builder.rank(rank).phoenixRank(threeOfAKindTrick.isPhoenixUsed() ? rank : null);
            }
            case FullHouseTrick fullHouseTrick -> {
                var rank = (float) fullHouseTrick.getRank();
                var phoenixRank = fullHouseTrick.getPhoenixRank();
                builder.rank(rank).phoenixRank(phoenixRank == null ? null : Float.valueOf(phoenixRank));
            }
            case ConsecutivePairsTrick consecutivePairsTrick -> {
                var phoenixRank = consecutivePairsTrick.getPhoenixRank();
                builder.minRank(consecutivePairsTrick.getMinRank())
                        .maxRank(consecutivePairsTrick.getMaxRank())
                        .phoenixRank(phoenixRank == null ? null : Float.valueOf(phoenixRank));
            }
            case StraightTrick straightTrick -> {
                var phoenixRank = straightTrick.getPhoenixRank();
                builder.minRank(straightTrick.getMinRank())
                        .maxRank(straightTrick.getMaxRank())
                        .phoenixRank(phoenixRank == null ? null : Float.valueOf(phoenixRank));
            }
            case DogTrick ignored -> {}
            case FourOfAKindTrick fourOfAKindTrick -> {
                builder.rank((float) fourOfAKindTrick.getRank());
            }
            case StraightFlushTrick straightFlushTrick -> {
                builder.minRank(straightFlushTrick.getMinRank()).maxRank(straightFlushTrick.getMaxRank());
            }
            case null, default -> throw new IllegalArgumentException("Invalid trick type");
        }

        return builder.build();
    }

    public List<TrickDto> toDtos(List<Trick> tricks) {
        return tricks.stream().map(this::toDto).toList();
    }
}
