package com.icube.sim.tichu.users;

import com.icube.sim.tichu.auth.social.UserIdentityDto;

import java.util.List;

public record AccountDto(
        UserDto user,
        List<UserIdentityDto> identities
) {
}
