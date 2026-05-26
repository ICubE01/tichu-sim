package com.icube.sim.tichu.games.tichu;

import com.icube.sim.tichu.games.common.domain.Game;
import com.icube.sim.tichu.games.common.domain.GameRule;
import com.icube.sim.tichu.games.common.service.AbstractGameService;
import com.icube.sim.tichu.games.common.events.GameSetRuleEvent;
import com.icube.sim.tichu.games.tichu.dtos.*;
import com.icube.sim.tichu.games.tichu.events.TichuSetRuleEvent;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidTeamAssignmentException;
import com.icube.sim.tichu.games.tichu.exceptions.InvalidTichuDeclarationException;
import com.icube.sim.tichu.games.tichu.mappers.CardMapper;
import com.icube.sim.tichu.games.tichu.mappers.TichuMapper;
import com.icube.sim.tichu.rooms.MemberMessagePublisher;
import com.icube.sim.tichu.rooms.Room;
import com.icube.sim.tichu.rooms.RoomRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.function.Consumer;
import java.util.function.Function;

@Service
public class TichuService extends AbstractGameService {
    private final TichuMapper tichuMapper;
    private final CardMapper cardMapper;

    public TichuService(RoomRepository roomRepository,
                        ApplicationEventPublisher eventPublisher,
                        MemberMessagePublisher memberMessagePublisher) {
        super(roomRepository, eventPublisher, memberMessagePublisher);
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
        return withLock(roomId, game -> tichuMapper.toDto(game, getUserId(principal)));
    }

    public void largeTichu(String roomId, LargeTichuSend largeTichuSend, Principal principal) {
        var isLargeTichuDeclared = largeTichuSend.getIsLargeTichuDeclared();
        if (isLargeTichuDeclared == null) {
            throw new InvalidTichuDeclarationException();
        }

        withLockAndPublish(roomId, game -> {
            var round = game.getCurrentRound();
            round.largeTichu(getUserId(principal), isLargeTichuDeclared);
        });
    }

    public void smallTichu(String roomId, Principal principal) {
        withLockAndPublish(roomId, game -> {
            var round = game.getCurrentRound();
            round.smallTichu(getUserId(principal));
        });
    }

    public void exchange(String roomId, ExchangeSend exchangeSend, Principal principal) {
        withLockAndPublish(roomId, game -> {
            var exchangePhase = game.getCurrentRound().getExchangePhase();
            exchangePhase.queueExchange(
                    getUserId(principal),
                    cardMapper.toCardNullable(exchangeSend.getLeft()),
                    cardMapper.toCardNullable(exchangeSend.getMid()),
                    cardMapper.toCardNullable(exchangeSend.getRight()));
        });
    }

    public void playTrick(String roomId, TrickSend trickSend, Principal principal) {
        withLockAndPublish(roomId, game -> {
            var phase = game.getCurrentRound().getCurrentPhase();
            phase.playTrick(
                    getUserId(principal),
                    cardMapper.toCards(trickSend.getCards()),
                    trickSend.getWish());
        });
    }

    public void playBomb(String roomId, BombSend bombSend, Principal principal) {
        withLockAndPublish(roomId, game -> {
            var phase = game.getCurrentRound().getCurrentPhase();
            phase.playBomb(getUserId(principal), cardMapper.toCards(bombSend.getCards()));
        });
    }

    public void pass(String roomId, Principal principal) {
        withLockAndPublish(roomId, game -> {
            var phase = game.getCurrentRound().getCurrentPhase();
            phase.pass(getUserId(principal));
        });
    }

    public void selectDragonReceiver(
            String roomId,
            SelectDragonReceiverSend selectDragonReceiverSend,
            Principal principal
    ) {
        withLockAndPublish(roomId, game -> {
            var phase = game.getCurrentRound().getCurrentPhase();
            phase.selectDragonReceiver(getUserId(principal), selectDragonReceiverSend.getGiveRight());
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
}
