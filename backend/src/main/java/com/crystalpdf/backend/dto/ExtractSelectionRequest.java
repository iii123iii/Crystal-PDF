package com.crystalpdf.backend.dto;

import java.util.List;

public record ExtractSelectionRequest(List<Integer> pages, String sourcePassword) {}
