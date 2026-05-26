package com.icube.sim.tichu.rooms;

import com.icube.sim.tichu.common.ErrorDto;
import com.icube.sim.tichu.games.common.exceptions.GameHasAlreadyStartedException;
import com.icube.sim.tichu.rooms.dtos.CreateRoomRequest;
import com.icube.sim.tichu.rooms.dtos.CreateRoomResponse;
import com.icube.sim.tichu.rooms.dtos.RoomDto;
import com.icube.sim.tichu.rooms.dtos.RoomOpaqueDto;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService roomService;

    @GetMapping
    public List<RoomOpaqueDto> getRooms() {
        return roomService.getRooms();
    }

    @PostMapping
    public ResponseEntity<@NonNull CreateRoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            UriComponentsBuilder uriBuilder
    ) {
        var response = roomService.createRoom(request);
        var uri = uriBuilder.path("/api/rooms/{id}").buildAndExpand(response.getId()).toUri();
        return ResponseEntity.created(uri).body(response);
    }

    // Possible URI collision with `getRoom`, but it cannot collide because every room ID is 5 characters long.
    @GetMapping("/me")
    public ResponseEntity<@NonNull RoomDto> getMyRoom() {
        var myRoom = roomService.getMyRoom().orElse(null);
        if (myRoom == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(myRoom);
    }

    @GetMapping("/{id}")
    public RoomDto getRoom(@PathVariable(name = "id") String id) {
        return roomService.getRoom(id);
    }

    @PostMapping("/{id}")
    public void enterRoom(@PathVariable(name = "id") String id) {
        roomService.enterRoom(id);
    }

    @DeleteMapping("/{id}")
    public void leaveRoom(@PathVariable(name = "id") String id) {
        roomService.leaveRoom(id);
    }

    @ExceptionHandler(MemberAlreadyInOneRoomException.class)
    public ResponseEntity<@NonNull ErrorDto> handleMemberAlreadyInOneRoom() {
        return ResponseEntity.badRequest().body(new ErrorDto(
                "User is already in one room."
        ));
    }

    @ExceptionHandler(RoomNotFoundException.class)
    public ResponseEntity<@NonNull ErrorDto> handleRoomNotFound() {
        return ResponseEntity.badRequest().body(new ErrorDto(
                "Room not found."
        ));
    }

    @ExceptionHandler(TooManyMembersException.class)
    public ResponseEntity<@NonNull ErrorDto> handleMemberCount() {
        return ResponseEntity.badRequest().body(new ErrorDto(
                "Too many members."
        ));
    }

    @ExceptionHandler(GameHasAlreadyStartedException.class)
    public ResponseEntity<@NonNull ErrorDto> handleGameHasAlreadyStarted() {
        return ResponseEntity.badRequest().body(new ErrorDto(
                "Game has already started."
        ));
    }
}
