package com.icube.sim.tichu.games.hanabi.dtos;

import com.icube.sim.tichu.games.hanabi.cards.HanabiColor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

@NoArgsConstructor
@Data
public class ResolveBonusSend {
    @Nullable
    private Long targetId;
    @Nullable
    private HanabiColor color;
    @Nullable
    private Integer value;
    @Nullable
    private Integer discardIndex;
}
