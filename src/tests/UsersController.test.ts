import request from "supertest";
import { prisma } from "@/database/prisma";

import { app } from "@/app";

describe("UsersController", () => {
  let user_id: string | undefined;

  let admin_id: string | undefined;

  afterAll(async () => {
    if (user_id) {
      await prisma.user.delete({ where: { id: user_id } });
    } else {
      console.warn("Nenhum usuário criado para deletar no afterAll.");
    }

    if (admin_id) {
      await prisma.user.delete({ where: { id: admin_id } });
    } else {
      console.warn("Nenhum usuário criado para deletar no afterAll.");
    }

    await prisma.$disconnect();
  });

  it("should create a new user successfully", async () => {
    const response = await request(app).post("/users").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123"
    });

    expect(response.status).toBe(201);
    expect(response.body.userWithoutPassword).toHaveProperty("id");
    expect(response.body.userWithoutPassword.name).toBe("Test User");

    user_id = response.body.userWithoutPassword.id;
  });

  it("Email already exists?", async () => {
    const response = await request(app).post("/users").send({
      name: "Duplicate User",
      email: "testuser@example.com",
      password: "password123"
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Um usuário com esse email já existe!");
  });

  it("validation email functioning?", async () => {
    const response = await request(app).post("/users").send({
      name: "Test User",
      email: "invalid-email",
      password: "password123"
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("validation error");
  });

  it("deve criar usuário com role 'member' por padrão", async () => {
      const userResponse = await request(app).post("/users").send({
        name: "Usuário teste",
        email: "teste@example.com",
        password: "senha123"
      });
  
      const sessionResponse = await request(app).post("/sessions").send({
        email: "teste@example.com",
        password: "password123",
      });
  
      admin_id = userResponse.body.userWithoutPassword.id;
  
      expect(userResponse.status).toBe(201);
      expect(userResponse.body.userWithoutPassword.role).toBe("member");
    });

});