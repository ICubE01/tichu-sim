package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.cards.ClueType;
import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;
import lombok.Data;
import org.jspecify.annotations.Nullable;

@Data
public class HintSend {
    private Long targetId;
    private ClueType clueType;
    @Nullable
    private HanabiColor color;
    @Nullable
    private Integer value;
}
