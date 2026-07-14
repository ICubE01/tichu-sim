package com.icube.sim.tichu.games.hanabi.mappers;

import com.icube.sim.tichu.games.hanabi.Hanabi;
import com.icube.sim.tichu.games.hanabi.HanabiPlayer;
import com.icube.sim.tichu.games.hanabi.PendingBonus;
import com.icube.sim.tichu.games.hanabi.cards.Clue;
import com.icube.sim.tichu.games.hanabi.cards.ColorClue;
import com.icube.sim.tichu.games.hanabi.cards.Firework;
import com.icube.sim.tichu.games.hanabi.cards.HanabiCard;
import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;
import com.icube.sim.tichu.games.hanabi.cards.HeldCard;
import com.icube.sim.tichu.games.hanabi.cards.ValueClue;
import com.icube.sim.tichu.games.hanabi.dtos.CardViewDto;
import com.icube.sim.tichu.games.hanabi.dtos.DiscardInfo;
import com.icube.sim.tichu.games.hanabi.dtos.FireworkDto;
import com.icube.sim.tichu.games.hanabi.dtos.FreeHintInfo;
import com.icube.sim.tichu.games.hanabi.dtos.HanabiCardDto;
import com.icube.sim.tichu.games.hanabi.dtos.HanabiDto;
import com.icube.sim.tichu.games.hanabi.dtos.HintInfo;
import com.icube.sim.tichu.games.hanabi.dtos.PendingBonusDto;
import com.icube.sim.tichu.games.hanabi.dtos.PlayInfo;
import com.icube.sim.tichu.games.hanabi.dtos.PlayerDto;
import com.icube.sim.tichu.games.hanabi.dtos.RecoverToDeckInfo;
import com.icube.sim.tichu.games.hanabi.dtos.RecoverToPlayInfo;
import com.icube.sim.tichu.games.hanabi.events.HanabiDiscardEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiHintEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiPlayEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiResolveFreeHintEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiResolveRecoverToDeckEvent;
import com.icube.sim.tichu.games.hanabi.events.HanabiResolveRecoverToPlayEvent;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.List;

public class HanabiMapper {
    /**
     * Builds the masked view for {@code viewerId}: every other player's cards are fully visible,
     * while the viewer's own cards expose only the clue knowledge gathered about them.
     */
    public HanabiDto toDto(Hanabi game, long viewerId) {
        var playerDtos = new ArrayList<PlayerDto>();
        for (var player : game.getPlayers()) {
            playerDtos.add(toPlayerDto(player, viewerId));
        }

        return new HanabiDto(
                game.getRule(),
                viewerId,
                playerDtos,
                game.getDeckSize(),
                game.getFireworks().values().stream().map(this::toFireworkDto).toList(),
                game.getDiscardPile().stream().map(this::toCardDto).toList(),
                game.getClueTokens(),
                Hanabi.maxClueTokens(),
                game.getFuseTokens(),
                Hanabi.maxFuseTokens(),
                game.getCurrentTurnIndex(),
                game.getFinalTurnsRemaining(),
                game.isExploded(),
                game.isEnded(),
                toPendingBonusDto(game.getPendingBonus())
        );
    }

    private PlayerDto toPlayerDto(HanabiPlayer player, long viewerId) {
        var isViewer = player.getId() == viewerId;
        var cardViews = player.getHand().stream()
                .map(heldCard -> toCardViewDto(heldCard, isViewer))
                .toList();
        return new PlayerDto(player.getId(), player.getName(), cardViews);
    }

    private CardViewDto toCardViewDto(HeldCard heldCard, boolean isOwn) {
        var card = isOwn ? emptyCardDto() : toCardDto(heldCard.getCard());
        return new CardViewDto(
                card,
                List.copyOf(heldCard.getPositiveColorClues()),
                List.copyOf(heldCard.getNegativeColorClues()),
                List.copyOf(heldCard.getPositiveValueClues()),
                List.copyOf(heldCard.getNegativeValueClues())
        );
    }

    private FireworkDto toFireworkDto(Firework firework) {
        return new FireworkDto(
                firework.getColor(),
                firework.playCount(),
                firework.isComplete(),
                firework.topValue(),
                firework.getColor().isDescending()
        );
    }

    private @Nullable PendingBonusDto toPendingBonusDto(@Nullable PendingBonus pendingBonus) {
        if (pendingBonus == null) {
            return null;
        }
        return new PendingBonusDto(pendingBonus.effect(), pendingBonus.playerId());
    }

    /**
     * The per-action delta messages below. They carry only what the action changed; the resulting
     * scalar counters (tokens, deck size, turn) are read live from the game, which is already in its
     * final post-action state when these run.
     */

    public HintInfo toHintInfo(HanabiHintEvent event) {
        return new HintInfo(
                event.getFromId(),
                event.getTargetId(),
                event.getClue().type(),
                clueColor(event.getClue()),
                clueValue(event.getClue()),
                event.getMatchedIndexes()
        );
    }

    public DiscardInfo toDiscardInfo(HanabiDiscardEvent event, long viewerId) {
        return new DiscardInfo(
                event.getPlayerId(),
                event.getIndex(),
                toCardDto(event.getDiscardedCard()),
                maskedDrawn(event.getDrawnCard(), event.getPlayerId(), viewerId)
        );
    }

    public PlayInfo toPlayInfo(HanabiPlayEvent event, long viewerId) {
        return new PlayInfo(
                event.getPlayerId(),
                event.getIndex(),
                toCardDto(event.getPlayedCard()),
                event.isSuccess(),
                event.isFireworkCompleted(),
                event.getBonusEffect(),
                maskedDrawn(event.getDrawnCard(), event.getPlayerId(), viewerId)
        );
    }

    /** Free-hint bonus: the completer gave a color or value hint to another player, then drew. */
    public FreeHintInfo toFreeHintInfo(HanabiResolveFreeHintEvent event, long viewerId) {
        return new FreeHintInfo(
                event.getFromId(),
                event.getTargetId(),
                event.getClue().type(),
                clueColor(event.getClue()),
                clueValue(event.getClue()),
                event.getMatchedIndexes(),
                maskedDrawn(event.getDrawnCard(), event.getFromId(), viewerId)
        );
    }

    /** Recover-to-deck bonus: the chosen discard was shuffled back into the deck, then the completer drew. */
    public RecoverToDeckInfo toRecoverToDeckInfo(HanabiResolveRecoverToDeckEvent event, long viewerId) {
        return new RecoverToDeckInfo(
                event.getPlayerId(),
                toCardDto(event.getCard()),
                maskedDrawn(event.getDrawnCard(), event.getPlayerId(), viewerId)
        );
    }

    /**
     * Recover-to-play bonus: the chosen discard was placed straight onto its firework, then the
     * completer drew. A recovered '5' that completes the stack may reveal a further bonus tile.
     */
    public RecoverToPlayInfo toRecoverToPlayInfo(HanabiResolveRecoverToPlayEvent event, long viewerId) {
        return new RecoverToPlayInfo(
                event.getPlayerId(),
                event.getIndex(),
                toCardDto(event.getCard()),
                event.isFireworkCompleted(),
                event.getBonusEffect(),
                maskedDrawn(event.getDrawnCard(), event.getPlayerId(), viewerId)
        );
    }

    /** A drawn card is hidden from the drawer (who never sees their own hand) and shown to everyone else. */
    private @Nullable HanabiCardDto maskedDrawn(@Nullable HanabiCard drawn, long drawerId, long viewerId) {
        if (drawn == null) {
            return null;
        }
        if (viewerId == drawerId) {
            return emptyCardDto();
        }
        return toCardDto(drawn);
    }

    private @Nullable HanabiColor clueColor(Clue clue) {
        return clue instanceof ColorClue(HanabiColor color) ? color : null;
    }

    private @Nullable Integer clueValue(Clue clue) {
        return clue instanceof ValueClue(int value) ? value : null;
    }

    private HanabiCardDto toCardDto(HanabiCard card) {
        return new HanabiCardDto(card.color(), card.value());
    }

    private HanabiCardDto emptyCardDto() {
        return new HanabiCardDto(null, null);
    }
}
