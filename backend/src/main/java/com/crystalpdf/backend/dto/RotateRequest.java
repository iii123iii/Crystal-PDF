package com.crystalpdf.backend.dto;

import java.util.List;

public record RotateRequest(List<Integer> pages, Integer rotation, String sourcePassword) {}
