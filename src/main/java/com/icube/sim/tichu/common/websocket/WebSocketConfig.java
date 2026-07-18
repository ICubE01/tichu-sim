package com.icube.sim.tichu.common.websocket;

import com.icube.sim.tichu.auth.jwt.JwtAuthenticationInterceptor;
import com.icube.sim.tichu.rooms.RoomInboundChannelInterceptor;
import com.icube.sim.tichu.rooms.RoomOutboundChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@RequiredArgsConstructor
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Value("${spring.cors.allowed-origin}")
    private String corsAllowedOrigin;
    private TaskScheduler messageBrokerTaskScheduler;
    private final JwtAuthenticationInterceptor jwtAuthenticationInterceptor;
    private final RoomInboundChannelInterceptor roomInboundChannelInterceptor;
    private final RoomOutboundChannelInterceptor roomOutboundChannelInterceptor;

    @Autowired
    public void setMessageBrokerTaskScheduler(
            @Lazy @Qualifier("messageBrokerTaskScheduler") TaskScheduler taskScheduler) {
        this.messageBrokerTaskScheduler = taskScheduler;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/api/ws")
                .setAllowedOrigins(corsAllowedOrigin);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/user")
                .setTaskScheduler(messageBrokerTaskScheduler)
                .setHeartbeatValue(new long[]{10000, 10000});
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(
                jwtAuthenticationInterceptor,
                new DestinationCheckInitializeInterceptor(),
                roomInboundChannelInterceptor,
                new UserInboundChannelInterceptor(),
                new DestinationGuardInterceptor()
        );
    }

    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.interceptors(roomOutboundChannelInterceptor);
    }
}
