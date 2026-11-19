package com.campusconnect.client;

import com.campusconnect.config.MetaInstagramProperties;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.Map;
import java.util.Optional;

public class MetaInstagramApiClientLiveTest {

    @Test
    void testLiveInstagramConnection() {
        MetaInstagramProperties properties = new MetaInstagramProperties();

        try (InputStream is = getClass().getResourceAsStream("/application-local.yml")) {
            if (is != null) {
                Yaml yaml = new Yaml();
                Map<String, Object> data = yaml.load(is);
                if (data != null && data.containsKey("meta")) {
                    Map<String, Object> meta = (Map<String, Object>) data.get("meta");
                    if (meta != null && meta.containsKey("instagram")) {
                        Map<String, Object> ig = (Map<String, Object>) meta.get("instagram");
                        properties.setAppId((String) ig.get("app-id"));
                        properties.setAppSecret((String) ig.get("app-secret"));
                        properties.setAccessToken((String) ig.get("access-token"));
                        properties.setAccountId(String.valueOf(ig.get("account-id")));
                        properties.setCommunityAccount((String) ig.get("community-account"));
                        properties.setDevMode(Boolean.TRUE.equals(ig.get("dev-mode")));
                        properties.setApiVersion("v21.0");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Could not load application-local.yml: " + e.getMessage());
        }

        System.out.println("=================================================");
        System.out.println("Testing Meta Instagram Graph API Connection...");
        System.out.println("App ID: " + properties.getAppId());
        System.out.println("Account ID: " + properties.getAccountId());
        System.out.println("Community Handle: @" + properties.getCommunityAccount());
        System.out.println("=================================================");

        MetaInstagramApiClient client = new MetaInstagramApiClient(properties);
        Optional<MetaInstagramApiClient.InstagramUserProfile> profile = client.testConnection();

        if (profile.isPresent()) {
            MetaInstagramApiClient.InstagramUserProfile p = profile.get();
            System.out.println("✅ SUCCESS! Connected to Meta Graph API!");
            System.out.println("   Instagram Username: @" + p.getUsername());
            System.out.println("   Instagram Account Name: " + p.getName());
            System.out.println("   Instagram ID: " + p.getId());
            System.out.println("=================================================");
        } else {
            System.out.println("⚠️ Could not fetch profile with testConnection.");
        }
    }
}
