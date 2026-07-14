package com.icube.sim.tichu.games.hanabi.dtos;

import java.util.List;

public record PlayerDto(long playerId, String name, List<CardViewDto> cardViews) {
}
