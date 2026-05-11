package com.taskmanager.controller;

import com.taskmanager.dto.CommentRequest;
import com.taskmanager.dto.CommentResponse;
import com.taskmanager.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getAll(@PathVariable Long taskId) {
        return ResponseEntity.ok(commentService.getByTask(taskId));
    }

    @PostMapping
    public ResponseEntity<CommentResponse> add(@PathVariable Long taskId,
                                               @Valid @RequestBody CommentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.add(taskId, req));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(@PathVariable Long taskId,
                                       @PathVariable Long commentId) {
        commentService.delete(taskId, commentId);
        return ResponseEntity.noContent().build();
    }
}
