package com.icube.sim.tichu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TichuSimApplication {
    public static void main(String[] args) {
        SpringApplication.run(TichuSimApplication.class, args);
    }
}
