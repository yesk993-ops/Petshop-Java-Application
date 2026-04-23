package com.petshop.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class PetControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testGetAllPets() throws Exception {
        mockMvc.perform(get("/api/pets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.1").value("Dog"))
                .andExpect(jsonPath("$.2").value("Cat"));
    }

    @Test
    public void testGetPetById() throws Exception {
        mockMvc.perform(get("/api/pets/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Dog"));
    }

    @Test
    public void testAddPet() throws Exception {
        String json = "{\"id\":\"4\",\"name\":\"Rabbit\"}";
        mockMvc.perform(post("/api/pets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isOk())
                .andExpect(content().string("Pet added successfully"));
    }
}