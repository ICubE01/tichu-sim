package com.icube.sim.tichu.games.tichu.dtos;

import com.icube.sim.tichu.games.tichu.Team;

public record PlayerDto(Long id, String name, Team team) {
}
