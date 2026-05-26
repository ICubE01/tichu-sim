package com.icube.sim.tichu.rooms;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MemberRepository {
    private final Map<Long, Member> members = new ConcurrentHashMap<>();

    public void save(Member member) {
        members.put(member.getId(), member);
    }

    public Optional<Member> findById(long id) {
        return Optional.ofNullable(members.get(id));
    }

    public boolean existsById(long id) {
        return members.containsKey(id);
    }

    public void deleteById(long id) {
        members.remove(id);
    }
}
