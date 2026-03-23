package com.icube.sim.tichu.rooms;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Mapper(componentModel = "spring")
public interface RoomMapper {
    @Mapping(target = "memberCount", expression = "java(room.getMembers().size())")
    @Mapping(target = "hasGameStarted", expression = "java(room.hasGameStarted())")
    RoomOpaqueDto toOpaqueDto(Room room);

    @Mapping(target = "hasGameStarted", expression = "java(room.hasGameStarted())")
    @Mapping(target = "gameRule", expression = "java(room.getGameRule())")
    RoomDto toDto(Room room);

    // Helper method
    default List<MemberDto> membersMapToDtoList(Map<Long, Member> map) {
        if (map == null) {
            return null;
        }

        return map.values().stream()
                .sorted(Comparator.comparing(Member::getSeq))
                .map(member -> new MemberDto(member.getId(), member.getName()))
                .toList();
    }
}
