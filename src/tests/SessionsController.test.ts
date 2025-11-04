import request from "supertest";
import { prisma } from "@/database/prisma";

import { app } from "@/app";

describe("SessionsController", () => {
  let user_id: string | undefined;

  afterAll(async () => {
    if (user_id) {
      await prisma.user.delete({ where: { id: user_id } });
    } else {
      console.warn("Nenhum usuário criado para deletar no afterAll.");
    }

    await prisma.$disconnect();
  });
  it("Should authenticate and access bearer token!", async () => {
    const userResponse = await request(app).post("/users").send({
      name: "Auth User Test",
      email: "Auth__user_test@example.com",
      password: "password123",
    });

    user_id = userResponse.body.userWithoutPassword.id;

    const sessionResponse = await request(app).post("/sessions").send({
      email: "Auth__user_test@example.com",
      password: "password123",
    });

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.token).toEqual(expect.any(String));
  });


});
