package com.example.demo.dto;

import com.example.demo.entity.LeagueMember;

public record SetMemberRoleRequest(Long adminUserId, LeagueMember.Role role) {}
