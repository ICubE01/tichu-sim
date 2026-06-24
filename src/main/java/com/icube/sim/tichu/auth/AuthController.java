package com.icube.sim.tichu.auth;

import com.icube.sim.tichu.auth.jwt.JwtResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final RefreshTokenCookieFactory refreshTokenCookieFactory;
    private final AuthService authService;

    @PostMapping("/login")
    public JwtResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        var jwtIssueResult = authService.login(request);
        response.addCookie(refreshTokenCookieFactory.create(jwtIssueResult));
        return new JwtResponse(jwtIssueResult.getAccessToken().toString());
    }

    @PostMapping("/refresh")
    public JwtResponse refresh(
            @CookieValue(value = RefreshTokenCookieFactory.COOKIE_NAME) String refreshToken,
            HttpServletResponse response
    ) {
        var jwtIssueResult = authService.refreshTokens(refreshToken);
        response.addCookie(refreshTokenCookieFactory.create(jwtIssueResult));
        return new JwtResponse(jwtIssueResult.getAccessToken().toString());
    }

    // Mapped under /refresh (not /logout), so the refresh_token cookie, scoped to path /api/auth/refresh,
    // is sent with the request.
    @DeleteMapping("/refresh")
    public ResponseEntity<@NonNull Void> logout(
            @CookieValue(value = RefreshTokenCookieFactory.COOKIE_NAME, required = false) String refreshToken,
            HttpServletResponse response
    ) {
        authService.destroyRefreshToken(refreshToken);
        response.addCookie(refreshTokenCookieFactory.createExpired());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public MeResponse getMe() {
        var user = authService.getCurrentUser();
        return new MeResponse(user.getId(), user.getName(), user.getRole());
    }

    @GetMapping("/issue/web-socket-token")
    public JwtResponse issueWebSocketToken() {
        var webSocketToken = authService.issueWebSocketToken();
        return new JwtResponse(webSocketToken.toString());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<@NonNull Void> handleBadCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
