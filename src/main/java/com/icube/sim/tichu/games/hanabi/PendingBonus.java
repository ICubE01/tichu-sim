package com.icube.sim.tichu.games.hanabi;

/**
 * An interactive Flamboyant Fireworks bonus awaiting a follow-up choice from the player who completed
 * the firework (e.g. which player to freely hint, or which discard to recover).
 */
public record PendingBonus(BonusEffect effect, long playerId) {
}
