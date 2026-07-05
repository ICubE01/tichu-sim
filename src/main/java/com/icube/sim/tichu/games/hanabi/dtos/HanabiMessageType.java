package com.icube.sim.tichu.games.hanabi.dtos;

public enum HanabiMessageType {
    SET_RULE,
    START,
    STATE,
    HINT,
    DISCARD,
    PLAY,
    RESOLVE_FREE_HINT,
    RESOLVE_RECOVER_TO_DECK,
    RESOLVE_RECOVER_TO_PLAY,
    END,
}
