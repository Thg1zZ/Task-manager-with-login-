package com.taskmanager.dto;

import com.taskmanager.entity.Task.TaskPriority;
import com.taskmanager.entity.Task.TaskStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TaskRequest {

    @NotBlank(message = "Título é obrigatório")
    @Size(min = 1, max = 200)
    private String title;

    @Size(max = 2000)
    private String description;

    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate dueDate;
    private Long categoryId;

    @Min(value = 1)
    private Integer estimatedMinutes;
}
