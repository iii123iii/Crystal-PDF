package com.crystalpdf.backend.dto;

import java.util.List;

public record DeletePagesRequest(List<Integer> pages, String sourcePassword) {}
