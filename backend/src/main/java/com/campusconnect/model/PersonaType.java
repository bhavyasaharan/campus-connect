package com.campusconnect.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PersonaType {
    STUDENT,
    PASSOUT,
    WORKING_PROFESSIONAL,
    FREELANCER,
    CREATOR,
    OTHER;

    @JsonCreator
    public static PersonaType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return STUDENT;
        }
        for (PersonaType pt : PersonaType.values()) {
            if (pt.name().equalsIgnoreCase(value.trim())) {
                return pt;
            }
        }
        return STUDENT;
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}
