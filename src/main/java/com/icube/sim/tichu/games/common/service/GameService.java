package com.icube.sim.tichu.games.common.service;

import com.icube.sim.tichu.games.common.domain.GameRule;

import java.security.Principal;

public interface GameService {
    void setRule(String roomId, GameRule gameRule, Principal principal);
    void start(String roomId, Principal principal);
}
