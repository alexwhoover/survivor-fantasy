package com.example.demo.dto;

import java.util.List;

/** A league's season cast: its tribes in league order, and every contestant. */
public record CastResponse(List<TribeDto> tribes, List<ContestantDto> contestants) {}
