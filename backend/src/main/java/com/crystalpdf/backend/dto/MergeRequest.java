package com.crystalpdf.backend.dto;

import java.util.List;

public record MergeRequest(List<Long> otherDocumentIds) {}
