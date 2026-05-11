package com.taskmanager.dto;

import com.taskmanager.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {

    private Long id;
    private String name;
    private String color;
    private String icon;
    private long taskCount;
    private LocalDateTime createdAt;

    public static CategoryResponse fromEntity(Category cat, long taskCount) {
        return CategoryResponse.builder()
                .id(cat.getId())
                .name(cat.getName())
                .color(cat.getColor())
                .icon(cat.getIcon())
                .taskCount(taskCount)
                .createdAt(cat.getCreatedAt())
                .build();
    }
}
