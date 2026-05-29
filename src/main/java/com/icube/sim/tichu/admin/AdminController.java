package com.icube.sim.tichu.admin;

import com.icube.sim.tichu.auth.jwt.JwtResponse;
import com.icube.sim.tichu.common.ErrorDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/bots")
    public List<BotDto> getBots() {
        return adminService.getBots();
    }

    @PostMapping("/bots")
    public BotDto createBot(@Valid @RequestBody CreateBotRequest request) {
        return adminService.createBot(request);
    }

    @PostMapping("/bots/{id}/token")
    public JwtResponse issueBotToken(@PathVariable Long id) {
        return new JwtResponse(adminService.issueBotToken(id));
    }

    @ExceptionHandler(DuplicateBotException.class)
    public ResponseEntity<ErrorDto> handleDuplicateBot() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorDto("Bot already exists."));
    }

    @ExceptionHandler(BotNotFoundException.class)
    public ResponseEntity<Void> handleBotNotFound() {
        return ResponseEntity.notFound().build();
    }
}
