package com.icube.sim.tichu.rooms.dtos;

import com.icube.sim.tichu.games.common.domain.GameName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateRoomRequest {
    @NotBlank(message = "Name is required.")
    @Size(max = 20, message = "Name must be less than 20 characters.")
    private String name;

    @NotNull(message = "Game name is required.")
    private GameName gameName;
}
