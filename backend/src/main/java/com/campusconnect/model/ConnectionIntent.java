package com.campusconnect.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ConnectionIntent {
    DATING,
    NETWORKING,
    FRIENDSHIP,
    CAMPUS,
    CASUAL,
    OPEN_TO_ANY;

    @JsonCreator
    public static ConnectionIntent fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return OPEN_TO_ANY;
        }
        String clean = value.trim().toUpperCase();
        if (clean.equals("CAMPUS_BUDDIES") || clean.equals("CAMPUS_PEERS")) {
            return CAMPUS;
        }
        for (ConnectionIntent ci : ConnectionIntent.values()) {
            if (ci.name().equalsIgnoreCase(clean)) {
                return ci;
            }
        }
        return OPEN_TO_ANY;
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}
