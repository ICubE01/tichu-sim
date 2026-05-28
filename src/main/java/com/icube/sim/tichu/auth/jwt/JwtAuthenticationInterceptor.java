package com.icube.sim.tichu.auth.jwt;

import lombok.AllArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

@AllArgsConstructor
@Component
public class JwtAuthenticationInterceptor implements ChannelInterceptor {
    private static final String AUTH_TOKEN_KEY = "authToken";
    private final JwtService jwtService;

    @Override
    public @Nullable Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        var accessor = StompHeaderAccessor.wrap(message);
        var sessionAttributes = accessor.getSessionAttributes();
        assert sessionAttributes != null;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            var authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new MessageDeliveryException(message, "Access denied.");
            }

            var token = authHeader.replace("Bearer ", "");
            var jwt = jwtService.parse(token).orElse(null);
            if (jwt == null || jwt.isExpired() || jwt.getRole() == null) {
                throw new MessageDeliveryException(message, "Access denied.");
            }

            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + jwt.getRole()));
            var authentication = new UsernamePasswordAuthenticationToken(
                    jwt.getUserId(),
                    null,
                    authorities
            );
            sessionAttributes.put(AUTH_TOKEN_KEY, authentication);
            accessor.setUser(authentication);
        } else {
            var authentication = (UsernamePasswordAuthenticationToken) sessionAttributes.get(AUTH_TOKEN_KEY);
            if (authentication != null) {
                accessor.setUser(authentication);
            }
        }

        return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
    }
}
