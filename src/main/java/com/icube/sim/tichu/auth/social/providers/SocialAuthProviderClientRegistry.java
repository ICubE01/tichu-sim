package com.icube.sim.tichu.auth.social.providers;

import com.icube.sim.tichu.auth.social.SocialAuthProviderName;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SocialAuthProviderClientRegistry {
    private final Map<SocialAuthProviderName, SocialAuthProviderClient> clients;

    public SocialAuthProviderClientRegistry(List<SocialAuthProviderClient> clients) {
        this.clients = clients.stream()
                .collect(Collectors.toMap(SocialAuthProviderClient::provider, c -> c));
    }

    @PostConstruct
    public void validate() {
        var missing = EnumSet.allOf(SocialAuthProviderName.class);
        missing.removeAll(clients.keySet());
        if (!missing.isEmpty()) {
            throw new IllegalStateException("No SocialAuthProviderClient registered for: " + missing);
        }
    }

    public SocialAuthProviderClient get(SocialAuthProviderName provider) {
        var client = clients.get(provider);
        if (client == null) {
            throw new UnknownProviderException();
        }
        return client;
    }
}
