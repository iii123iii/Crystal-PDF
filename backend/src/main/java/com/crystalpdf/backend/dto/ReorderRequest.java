package com.crystalpdf.backend.dto;

import java.util.List;

public record ReorderRequest(List<Integer> pageOrder, String sourcePassword) {}
