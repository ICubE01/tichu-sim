package com.icube.sim.tichu.auth;

import com.icube.sim.tichu.auth.jwt.Jwt;
import com.icube.sim.tichu.auth.jwt.JwtIssueResult;
import com.icube.sim.tichu.auth.jwt.JwtService;
import com.icube.sim.tichu.users.Role;
import com.icube.sim.tichu.users.User;
import com.icube.sim.tichu.users.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@AllArgsConstructor
@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assert authentication != null;

        var userId = (Long) authentication.getPrincipal();
        assert userId != null;
        return userId;
    }

    public User getCurrentUser() {
        return userRepository.findById(getCurrentUserId()).orElseThrow();
    }

    public JwtIssueResult login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        return issueTokens(user);
    }

    @Transactional
    public JwtIssueResult refreshTokens(String oldRefreshToken) {
        var jwt = jwtService.parse(oldRefreshToken).orElse(null);
        if (jwt == null || jwt.isExpired()) {
            throw new BadCredentialsException("Refresh token is invalid.");
        }

        var user = userRepository.findById(jwt.getUserId()).orElseThrow();
        if (!oldRefreshToken.equals(user.getRefreshToken())) {
            throw new BadCredentialsException("Refresh token is invalid.");
        }
        if (user.getRole() == Role.BOT) {
            throw new BadCredentialsException("Bots cannot refresh tokens.");
        }

        return issueTokens(user);
    }

    public void logout(String refreshToken) {
        if (refreshToken == null) {
            return;
        }
        var jwt = jwtService.parse(refreshToken).orElse(null);
        if (jwt == null) {
            return;
        }

        userRepository.findById(jwt.getUserId()).ifPresent(user -> {
            user.setRefreshToken(null);
            userRepository.save(user);
        });
    }

    private JwtIssueResult issueTokens(User user) {
        if (user.getRole() == Role.BOT) {
            throw new BadCredentialsException("Bots cannot log in.");
        }

        var accessToken = jwtService.generateAccessToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        user.setRefreshToken(refreshToken.toString());
        userRepository.save(user);
        return new JwtIssueResult(accessToken, refreshToken);
    }

    public Jwt issueWebSocketToken() {
        return jwtService.generateWebSocketToken(getCurrentUser());
    }
}
