package com.icube.sim.tichu.games.tichu;

import com.icube.sim.tichu.games.common.domain.Game;
import com.icube.sim.tichu.games.common.domain.GameRule;
import com.icube.sim.tichu.games.common.event.GameSetRuleEvent;
import com.icube.sim.tichu.games.common.service.AbstractGameService;
import com.icube.sim.tichu.games.tichu.dtos.*;
import com.icube.sim.tichu.games.tichu.events.TichuSetRuleEvent;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidTeamAssignmentException;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidTichuDeclarationException;
import com.icube.sim.tichu.games.tichu.mappers.CardMapper;
import com.icube.sim.tichu.games.tichu.mappers.TichuMapper;
import com.icube.sim.tichu.rooms.Room;
import com.icube.sim.tichu.rooms.RoomRepository;
import org.jspecify.annotations.NonNull;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.function.Consumer;
import java.util.function.Function;

@Service
public class TichuService extends AbstractGameService {
    private final TichuMapper tichuMapper;
    private final CardMapper cardMapper;

    public TichuService(RoomRepository roomRepository, ApplicationEventPublisher eventPublisher) {
        super(roomRepository, eventPublisher);
        tichuMapper = new TichuMapper();
        cardMapper = new CardMapper();
    }

    @Override
    protected void checkRule(GameRule gameRule) {
        assert gameRule instanceof TichuRule;

        var tichuRule = (TichuRule) gameRule;
        if (tichuRule.teamAssignment().size() > 4) {
            throw new InvalidTeamAssignmentException();
        }
    }

    @Override
    protected GameSetRuleEvent createSetRuleEvent(GameRule gameRule) {
        return new TichuSetRuleEvent((TichuRule) gameRule);
    }

    @Override
    protected void postStart(Game game, Room room) {
        // Empty
    }

    public TichuDto get(String roomId, Principal principal) {
        return withLock(roomId, game -> tichuMapper.toDto(game, getPlayerId(principal)));
    }

    public void largeTichu(String roomId, LargeTichuSend largeTichuSend, Principal principal) {
        var isLargeTichuDeclared = largeTichuSend.getIsLargeTichuDeclared();
        if (isLargeTichuDeclared == null) {
            throw new InvalidTichuDeclarationException();
        }

        withLockAndPublish(roomId, game -> {
            var round = game.getCurrentRound();
            round.largeTichu(getPlayerId(principal), isLargeTichuDeclared);
        });
    }

    public void smallTichu(String roomId, Principal principal) {
        withLockAndPublish(roomId, game -> {
            var round = game.getCurrentRound();
            round.smallTichu(getPlayerId(principal));
        });
    }

    public void exchange(String roomId, ExchangeSend exchangeSend, Principal principal) {
        withLockAndPublish(roomId, game -> {
            var exchangePhase = game.getCurrentRound().getExchangePhase();
            exchangePhase.queueExchange(
                    getPlayerId(principal),
                    cardMapper.toCardNullable(exchangeSend.getLeft()),
                    cardMapper.toCardNullable(exchangeSend.getMid()),
                    cardMapper.toCardNullable(exchangeSend.getRight()));
        });
    }

    public void playTrick(String roomId, TrickSend trickSend, Principal principal) {
        withLockAndPublish(roomId, game -> {
            var phase = game.getCurrentRound().getCurrentPhase();
            phase.playTrick(
                    getPlayerId(principal),
                    cardMapper.toCards(trickSend.getCards()),
                    trickSend.getWish());
        });
    }

    public void playBomb(String roomId, BombSend bombSend, Principal principal) {
        withLockAndPublish(roomId, game -> {
            var phase = game.getCurrentRound().getCurrentPhase();
            phase.playBomb(getPlayerId(principal), cardMapper.toCards(bombSend.getCards()));
        });
    }

    public void pass(String roomId, Principal principal) {
        withLockAndPublish(roomId, game -> {
            var phase = game.getCurrentRound().getCurrentPhase();
            phase.pass(getPlayerId(principal));
        });
    }

    public void selectDragonReceiver(
            String roomId,
            SelectDragonReceiverSend selectDragonReceiverSend,
            Principal principal
    ) {
        withLockAndPublish(roomId, game -> {
            var phase = game.getCurrentRound().getCurrentPhase();
            phase.selectDragonReceiver(getPlayerId(principal), selectDragonReceiverSend.getGiveRight());
        });
    }

    private <T> T withLock(String roomId, Function<Tichu, T> action) {
        var game = getGame(roomId);
        game.lock();
        try {
            return action.apply(game);
        } finally {
            game.unlock();
        }
    }

    private void withLockAndPublish(String roomId, Consumer<Tichu> action) {
        var game = getGame(roomId);
        game.lock();
        try {
            action.accept(game);
            publishQueuedEvents(game, roomId);
        } finally {
            game.unlock();
        }
    }

    @Override
    protected Tichu getGame(String roomId) {
        return (Tichu) super.getGame(roomId);
    }

    private static @NonNull Long getPlayerId(Principal principal) {
        return Long.valueOf(principal.getName());
    }
}
