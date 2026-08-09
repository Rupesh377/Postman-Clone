package com.rupesh.Postman.Clone.WorkspaceMember;

import com.rupesh.Postman.Clone.WorkspaceMember.DTO.MemberResponseDTO;

public class Mapper {

    public static MemberResponseDTO toDTO(WorkspaceMember member) {

        MemberResponseDTO dto = new MemberResponseDTO();
        dto.setId(member.getId());
        dto.setName(member.getUser().getName());
        dto.setEmail(member.getUser().getEmail());
        dto.setRole(member.getRole());
        dto.setJoinedAt(member.getJoinedAt());

        return dto;
    }
}
