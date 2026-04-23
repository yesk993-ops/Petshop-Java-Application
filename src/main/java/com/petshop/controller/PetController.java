package com.petshop.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/pets")
public class PetController {

    private final Map<Long, String> pets = new HashMap<>();

    public PetController() {
        pets.put(1L, "Dog");
        pets.put(2L, "Cat");
        pets.put(3L, "Bird");
    }

    @GetMapping
    public Map<Long, String> getAllPets() {
        return pets;
    }

    @GetMapping("/{id}")
    public String getPetById(@PathVariable Long id) {
        return pets.getOrDefault(id, "Pet not found");
    }

    @PostMapping
    public String addPet(@RequestBody Map<String, String> request) {
        Long id = Long.parseLong(request.get("id"));
        String name = request.get("name");
        pets.put(id, name);
        return "Pet added successfully";
    }

    @DeleteMapping("/{id}")
    public String deletePet(@PathVariable Long id) {
        if (pets.containsKey(id)) {
            pets.remove(id);
            return "Pet deleted successfully";
        }
        return "Pet not found";
    }
}