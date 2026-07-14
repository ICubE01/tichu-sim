package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.HanabiRule;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

@Getter
public class HanabiMessage {
    private final HanabiMessageType type;
    @Nullable
    private final Object data;

    private HanabiMessage(HanabiMessageType type, @Nullable Object data) {
        this.type = type;
        this.data = data;
    }

    public static HanabiMessage setRule(HanabiRule rule) {
        return new HanabiMessage(HanabiMessageType.SET_RULE, rule);
    }

    public static HanabiMessage start() {
        return new HanabiMessage(HanabiMessageType.START, null);
    }

    public static HanabiMessage state(HanabiDto dto) {
        return new HanabiMessage(HanabiMessageType.STATE, dto);
    }

    public static HanabiMessage hint(HintInfo info) {
        return new HanabiMessage(HanabiMessageType.HINT, info);
    }

    public static HanabiMessage discard(DiscardInfo info) {
        return new HanabiMessage(HanabiMessageType.DISCARD, info);
    }

    public static HanabiMessage play(PlayInfo info) {
        return new HanabiMessage(HanabiMessageType.PLAY, info);
    }

    public static HanabiMessage resolveFreeHint(FreeHintInfo info) {
        return new HanabiMessage(HanabiMessageType.RESOLVE_FREE_HINT, info);
    }

    public static HanabiMessage resolveRecoverToDeck(RecoverToDeckInfo info) {
        return new HanabiMessage(HanabiMessageType.RESOLVE_RECOVER_TO_DECK, info);
    }

    public static HanabiMessage resolveRecoverToPlay(RecoverToPlayInfo info) {
        return new HanabiMessage(HanabiMessageType.RESOLVE_RECOVER_TO_PLAY, info);
    }

    public static HanabiMessage end(HanabiDto dto) {
        return new HanabiMessage(HanabiMessageType.END, dto);
    }
}
