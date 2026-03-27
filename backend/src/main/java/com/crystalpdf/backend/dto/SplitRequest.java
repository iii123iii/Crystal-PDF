package com.crystalpdf.backend.dto;

import java.util.List;

public record SplitRequest(List<Integer> pages, String sourcePassword) {}
