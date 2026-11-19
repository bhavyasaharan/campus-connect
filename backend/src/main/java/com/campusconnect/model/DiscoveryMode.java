package com.campusconnect.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum DiscoveryMode {
    ALL,
    CAMPUS,
    PROFESSIONAL,
    DATING;

    @JsonCreator
    public static DiscoveryMode fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return ALL;
        }
        for (DiscoveryMode dm : DiscoveryMode.values()) {
            if (dm.name().equalsIgnoreCase(value.trim())) {
                return dm;
            }
        }
        return ALL;
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}
