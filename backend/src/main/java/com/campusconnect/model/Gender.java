package com.campusconnect.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Gender {
    MALE,
    FEMALE,
    NON_BINARY,
    PREFER_NOT_TO_SAY;

    @JsonCreator
    public static Gender fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return PREFER_NOT_TO_SAY;
        }
        for (Gender g : Gender.values()) {
            if (g.name().equalsIgnoreCase(value.trim())) {
                return g;
            }
        }
        return PREFER_NOT_TO_SAY;
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}
