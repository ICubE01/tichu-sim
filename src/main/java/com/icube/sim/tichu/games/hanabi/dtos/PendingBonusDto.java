package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.BonusEffect;

public record PendingBonusDto(BonusEffect effect, long playerId) {
}
