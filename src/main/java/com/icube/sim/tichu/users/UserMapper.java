package com.icube.sim.tichu.users;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDto toDto(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "refreshToken", ignore = true)
    @Mapping(target = "role", ignore = true)
    User toEntity(RegisterUserRequest request);
}
