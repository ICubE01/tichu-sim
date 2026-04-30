package com.icube.sim.tichu.games.tichu.mappers;

import com.icube.sim.tichu.games.tichu.PhaseStatus;
import com.icube.sim.tichu.games.tichu.Player;
import com.icube.sim.tichu.games.tichu.RoundStatus;
import com.icube.sim.tichu.games.tichu.Tichu;
import com.icube.sim.tichu.games.tichu.dtos.ExchangeSend;
import com.icube.sim.tichu.games.tichu.dtos.TichuDto;
import com.icube.sim.tichu.games.tichu.dtos.TrickDto;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class TichuMapper {
    private final PlayerMapper playerMapper = new PlayerMapper();
    private final CardMapper cardMapper = new CardMapper();
    private final TrickMapper trickMapper = new TrickMapper();

    public TichuDto toDto(Tichu game, Long playerId) {
        var players = new ArrayList<Player>();
        for (var i = 0; i < 4; i++) {
            players.add(game.getPlayer(i));
        }
        var handCounts = players.stream().collect(Collectors.toMap(Player::getId, Player::getHandSize));
        var myHand = game.getPlayer(game.getPlayerIndexById(playerId)).getHand();

        var round = game.getCurrentRound();

        ExchangeSend myExchange = null;
        if (round.getStatus() == RoundStatus.EXCHANGING) {
            var exchangePhase = round.getExchangePhase();
            var exchange = exchangePhase.getExchange(playerId);
            myExchange = new ExchangeSend(
                    cardMapper.toDtoNullable(exchange[2]),
                    cardMapper.toDtoNullable(exchange[1]),
                    cardMapper.toDtoNullable(exchange[0])
            );
        }

        PhaseStatus phaseStatus = null;
        Integer turn = null;
        List<TrickDto> trickDtos = null;
        if (round.getStatus() == RoundStatus.PLAYING) {
            var phase = round.getCurrentPhase();
            phaseStatus = phase.getStatus();
            turn = phase.getTurn();
            trickDtos = trickMapper.toDtos(phase.getTricks());
        }

        return TichuDto.builder()
                .rule(game.getRule())
                .players(players.stream().map(playerMapper::toDto).toList())
                .scoresHistory(game.getScoresHistory())
                .handCounts(handCounts)
                .myHand(myHand.stream().map(cardMapper::toDto).toList())
                .roundStatus(round.getStatus())
                .tichuDeclarations(round.getTichuDeclarations())
                .myExchange(myExchange)
                .wish(round.getWish())
                .exitOrder(round.getExitOrder())
                .phaseStatus(phaseStatus)
                .turn(turn)
                .tricks(trickDtos)
                .build();
    }
}
