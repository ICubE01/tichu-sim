package com.icube.sim.tichu.auth;

import com.icube.sim.tichu.users.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public class UserAuthDto {
    private Long id;
    private String name;
    private Role role;
}
