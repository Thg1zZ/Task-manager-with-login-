package com.taskmanager.dto;

import com.taskmanager.entity.TaskComment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {

    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private String authorName;
    private Long authorId;

    public static CommentResponse fromEntity(TaskComment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .authorName(c.getUser().getName())
                .authorId(c.getUser().getId())
                .build();
    }
}
