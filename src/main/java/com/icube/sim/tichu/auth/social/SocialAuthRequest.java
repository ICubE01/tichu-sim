package com.icube.sim.tichu.auth.social;

import jakarta.validation.constraints.NotBlank;

public record SocialAuthRequest(
        @NotBlank String code,
        @NotBlank String state
) {
}
