package com.icube.sim.tichu.games.hanabi;

import com.icube.sim.tichu.games.common.domain.Game;
import com.icube.sim.tichu.games.common.domain.GameRule;
import com.icube.sim.tichu.games.common.events.GameSetRuleEvent;
import com.icube.sim.tichu.games.common.services.AbstractGameService;
import com.icube.sim.tichu.games.hanabi.cards.Clue;
import com.icube.sim.tichu.games.hanabi.cards.ClueType;
import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;
import com.icube.sim.tichu.games.hanabi.dtos.DiscardSend;
import com.icube.sim.tichu.games.hanabi.dtos.HanabiDto;
import com.icube.sim.tichu.games.hanabi.dtos.HintSend;
import com.icube.sim.tichu.games.hanabi.dtos.PlaySend;
import com.icube.sim.tichu.games.hanabi.dtos.ResolveBonusSend;
import com.icube.sim.tichu.games.hanabi.events.HanabiSetRuleEvent;
import com.icube.sim.tichu.games.hanabi.exceptions.InvalidActionException;
import com.icube.sim.tichu.games.hanabi.exceptions.InvalidHintException;
import com.icube.sim.tichu.games.hanabi.mappers.HanabiMapper;
import com.icube.sim.tichu.rooms.MemberMessagePublisher;
import com.icube.sim.tichu.rooms.Room;
import com.icube.sim.tichu.rooms.RoomRepository;
import org.jspecify.annotations.Nullable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.function.Consumer;
import java.util.function.Function;

@Service
public class HanabiService extends AbstractGameService {
    private final HanabiMapper hanabiMapper;

    public HanabiService(RoomRepository roomRepository,
                         ApplicationEventPublisher eventPublisher,
                         MemberMessagePublisher memberMessagePublisher) {
        super(roomRepository, eventPublisher, memberMessagePublisher);
        this.hanabiMapper = new HanabiMapper();
    }

    @Override
    protected void checkRule(GameRule gameRule) {
        assert gameRule instanceof HanabiRule;
    }

    @Override
    protected GameSetRuleEvent createSetRuleEvent(GameRule gameRule) {
        return new HanabiSetRuleEvent((HanabiRule) gameRule);
    }

    @Override
    protected void postStart(Game game, Room room) {
        // Hands are dealt in the Hanabi constructor; nothing to do here.
    }

    public HanabiDto get(String roomId, Principal principal) {
        return withLock(roomId, game -> hanabiMapper.toDto(game, getUserId(principal)));
    }

    public void giveHint(String roomId, HintSend hintSend, Principal principal) {
        if (hintSend.getTargetId() == null || hintSend.getClueType() == null) {
            throw new InvalidHintException();
        }
        var clue = toClue(hintSend.getClueType(), hintSend.getColor(), hintSend.getValue());
        withLockAndPublish(roomId, game -> game.giveHint(getUserId(principal), hintSend.getTargetId(), clue));
    }

    public void discard(String roomId, DiscardSend discardSend, Principal principal) {
        if (discardSend.getIndex() == null) {
            throw new InvalidActionException();
        }
        withLockAndPublish(roomId, game -> game.discard(getUserId(principal), discardSend.getIndex()));
    }

    public void play(String roomId, PlaySend playSend, Principal principal) {
        if (playSend.getIndex() == null) {
            throw new InvalidActionException();
        }
        withLockAndPublish(roomId, game -> game.play(getUserId(principal), playSend.getIndex()));
    }

    public void resolveBonus(String roomId, ResolveBonusSend send, Principal principal) {
        withLockAndPublish(roomId, game -> game.resolveBonus(
                getUserId(principal),
                send.getTargetId(),
                send.getColor(),
                send.getValue(),
                send.getDiscardIndex()));
    }

    private Clue toClue(ClueType type, @Nullable HanabiColor color, @Nullable Integer value) {
        if (type == ClueType.COLOR) {
            if (color == null) {
                throw new InvalidHintException();
            }
            return Clue.color(color);
        }
        if (value == null) {
            throw new InvalidHintException();
        }
        return Clue.value(value);
    }

    private <T> T withLock(String roomId, Function<Hanabi, T> action) {
        var game = getGame(roomId);
        game.lock();
        try {
            return action.apply(game);
        } finally {
            game.unlock();
        }
    }

    private void withLockAndPublish(String roomId, Consumer<Hanabi> action) {
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
    protected Hanabi getGame(String roomId) {
        return (Hanabi) super.getGame(roomId);
    }
}
