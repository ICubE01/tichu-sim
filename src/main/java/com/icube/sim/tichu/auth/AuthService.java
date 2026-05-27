package com.icube.sim.tichu.auth;

import com.icube.sim.tichu.auth.jwt.Jwt;
import com.icube.sim.tichu.auth.jwt.JwtIssueResult;
import com.icube.sim.tichu.auth.jwt.JwtService;
import com.icube.sim.tichu.users.User;
import com.icube.sim.tichu.users.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        assert authentication != null;

        var userId = (Long) authentication.getPrincipal();
        assert userId != null;

        return userRepository.findById(userId).orElse(null);
    }

    public JwtIssueResult login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        var accessToken = jwtService.generateAccessToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        user.setRefreshToken(refreshToken.toString());
        userRepository.save(user);

        return new JwtIssueResult(accessToken, refreshToken);
    }

    public JwtIssueResult refreshTokens(String oldRefreshToken) {
        var jwt = jwtService.parse(oldRefreshToken).orElse(null);
        if (jwt == null || jwt.isExpired()) {
            throw new BadCredentialsException("Refresh token is invalid.");
        }

        var user = userRepository.findById(jwt.getUserId()).orElseThrow();
        if (!oldRefreshToken.equals(user.getRefreshToken())) {
            throw new BadCredentialsException("Refresh token is invalid.");
        }

        var accessToken = jwtService.generateAccessToken(user);
        var newRefreshToken = jwtService.generateRefreshToken(user);
        user.setRefreshToken(newRefreshToken.toString());
        userRepository.save(user);

        return new JwtIssueResult(accessToken, newRefreshToken);
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

    public Jwt issueWebSocketToken() {
        return jwtService.generateWebSocketToken(getCurrentUser());
    }
}
