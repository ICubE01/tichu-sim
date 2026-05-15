package com.icube.sim.tichu.rooms;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties("spring.rooms")
public class RoomConfig {
    private int idLength;
    private long outGameExpiration;
    private long inGameExpiration;
}
