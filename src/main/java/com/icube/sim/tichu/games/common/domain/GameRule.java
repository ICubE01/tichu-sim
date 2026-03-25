package com.icube.sim.tichu.games.common.domain;

public interface GameRule {
    GameName getGameName();
    int getMinPlayers();
    int getMaxPlayers();
}
