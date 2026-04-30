package com.icube.sim.tichu.games.tichu.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class ExchangeSend {
    @Nullable
    private CardDto left;
    @Nullable
    private CardDto mid;
    @Nullable
    private CardDto right;
}
