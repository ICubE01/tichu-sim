package com.icube.sim.tichu.admin;

import com.icube.sim.tichu.auth.jwt.JwtService;
import com.icube.sim.tichu.users.Role;
import com.icube.sim.tichu.users.User;
import com.icube.sim.tichu.users.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@Service
public class AdminService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public List<BotDto> getBots() {
        return userRepository.findAllByRole(Role.BOT).stream()
                .map(u -> new BotDto(u.getId(), u.getName(), u.getEmail()))
                .toList();
    }

    public BotDto createBot(CreateBotRequest request) {
        var name = request.getName();
        var email = name + "@bot.tichu-sim.com";
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateBotException();
        }

        var bot = new User();
        bot.setName(name);
        bot.setEmail(email);
        bot.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        bot.setRole(Role.BOT);
        userRepository.save(bot);

        return new BotDto(bot.getId(), bot.getName(), bot.getEmail());
    }

    public String issueBotToken(Long botId) {
        var bot = userRepository.findById(botId).orElseThrow(BotNotFoundException::new);
        if (bot.getRole() != Role.BOT) {
            throw new BotNotFoundException();
        }
        return jwtService.generateBotAccessToken(bot).toString();
    }
}
