package com.icube.sim.tichu.games.tichu.dtos;

import com.icube.sim.tichu.games.tichu.PhaseStatus;
import com.icube.sim.tichu.games.tichu.RoundStatus;
import com.icube.sim.tichu.games.tichu.TichuDeclaration;
import com.icube.sim.tichu.games.tichu.TichuRule;
import lombok.Builder;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.util.List;
import java.util.Map;

@Builder
@Getter
public class TichuDto {
    private final TichuRule rule;
    private final List<PlayerDto> players;
    private final List<int[]> scoresHistory;
    private final Map<Long, Integer> handCounts;
    private final List<CardDto> myHand;
    private final RoundStatus roundStatus;
    private final TichuDeclaration[] tichuDeclarations;
    private final @Nullable ExchangeSend myExchange;
    private final @Nullable Integer wish;
    private final int[] exitOrder;
    private final @Nullable PhaseStatus phaseStatus;
    private final @Nullable Integer turn;
    private final @Nullable List<TrickDto> tricks;
}
