package com.campusconnect.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CampusStatus {
    ALL,
    STUDENT,
    PASSOUT;

    @JsonCreator
    public static CampusStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return ALL;
        }
        for (CampusStatus cs : CampusStatus.values()) {
            if (cs.name().equalsIgnoreCase(value.trim())) {
                return cs;
            }
        }
        return ALL;
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}
