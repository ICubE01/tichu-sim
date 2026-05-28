package com.icube.sim.tichu.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateBotRequest {
    @NotBlank
    @Pattern(regexp = "[A-Za-z0-9_-]+", message = "Name must contain only letters, digits, underscores, and hyphens")
    private String name;
}
