package com.crystalpdf.backend.dto;

public record HeaderFooterRequest(
        String sourcePassword,
        String headerLeft,
        String headerCenter,
        String headerRight,
        String footerLeft,
        String footerCenter,
        String footerRight,
        Float fontSize
) {}
