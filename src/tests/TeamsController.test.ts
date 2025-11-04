import request from "supertest";
import { prisma } from "@/database/prisma";
import { app } from "@/app";

describe("TeamsController", () => {
  let createdUserIds: string[] = [];
  let createdTeamIds: string[] = [];

  afterAll(async () => {
    try {
      // Deleta todos os usuários criados
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }

      // Deleta todos os times criados
      if (createdTeamIds.length > 0) {
        await prisma.team.deleteMany({
          where: { id: { in: createdTeamIds } },
        });
      }
    } catch (error) {
      console.error("Erro ao limpar dados no afterAll:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

  // CREATE
  it("criando um time", async () => {
    const userTeamResponse = await request(app).post("/users").send({
      name: "Team test User",
      email: "team_test_user@example.com",
      password: "password123",
      role: "admin",
    });

    const userIdCreated =
      userTeamResponse.body.userWithoutPassword?.id || userTeamResponse.body.id;
    createdUserIds.push(userIdCreated);

    const sessionResponse = await request(app).post("/sessions").send({
      email: "team_test_user@example.com",
      password: "password123",
    });

    const { token } = sessionResponse.body;

    const teamsResponse = await request(app)
      .post("/teams")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "test",
        description: "test test test test test test test test",
      });

    createdTeamIds.push(teamsResponse.body.team.id);

    expect(sessionResponse.status).toBe(200);
    expect(teamsResponse.status).toBe(201);
  });

  it("Verificando se duplica name", async () => {
    // Login do usuário admin
    const sessionResponse = await request(app).post("/sessions").send({
      email: "team_test_user@example.com",
      password: "password123",
    });
    const { token } = sessionResponse.body;

    // Cria o time original
    const originalTeamRes = await request(app)
      .post("/teams")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Front end",
        description: "Visual desenvolvido para aplicação frontend",
      });

    // Guarda o id do time criado para cleanup
    createdTeamIds.push(originalTeamRes.body.team?.id || originalTeamRes.body.id);

    // Agora tenta criar o mesmo time de novo
    const duplicateTeamRes = await request(app)
      .post("/teams")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Front end",
        description: "Visual desenvolvido para aplicação frontend",
      });

    expect(sessionResponse.status).toBe(200);
    expect(duplicateTeamRes.status).toBe(409);
  });

  // INDEX
  it("Listar os times", async () => {
    const sessionResponse = await request(app).post("/sessions").send({
      email: "team_test_user@example.com",
      password: "password123",
    });

    const { token } = sessionResponse.body;

    const response = await request(app)
      .get("/teams")
      .set("Authorization", `Bearer ${token}`);

    expect(sessionResponse.status).toBe(200);
    expect(response.status).toBe(200);
  });

  // TASK TEAM
  it("permissão para visualizar as tarefas do time", async () => {
    const userResponse = await request(app).post("/users").send({
      name: "Team Tasks Test",
      email: "team_tasks_test@example.com",
      password: "password123",
    });

    const userIdCreated =
      userResponse.body.userWithoutPassword?.id || userResponse.body.id;
    createdUserIds.push(userIdCreated);

    const sessionResponse = await request(app).post("/sessions").send({
      email: "team_tasks_test@example.com",
      password: "password123",
    });

    const { token } = sessionResponse.body;

    const teamsResponse = await request(app)
      .get(`/teams/${userIdCreated}`)
      .set("Authorization", `Bearer ${token}`);

    expect(sessionResponse.status).toBe(200);
    expect(teamsResponse.status).toBe(403);
    expect(userResponse.body.userWithoutPassword.role).toBe("member");
    expect(teamsResponse.body.message).toBe(
      "Você não tem permissão para visualizar esse time"
    );
  });

  it("Usuário não autenticado!", async () => {
    const team = await prisma.team.create({
      data: {
        name: "Time Teste Não Autenticado",
        description: "Time apenas para teste sem autenticação",
      },
    });

    createdTeamIds.push(team.id);

    const teamsResponse = await request(app).get(`/teams/${team.id}`);

    expect(teamsResponse.body.message).toBe("JWT token não encontrado!");
  });

  // UPDATE
  it("Atualizando o name e description do time", async () => {
    const userRes = await request(app).post("/users").send({
      name: "Admin Test Update",
      email: "admin_test_update@example.com",
      password: "password123",
      role: "admin",
    });
    const userIdCreated =
      userRes.body.userWithoutPassword?.id || userRes.body.id;
    createdUserIds.push(userIdCreated);

    const sessionRes = await request(app).post("/sessions").send({
      email: "admin_test_update@example.com",
      password: "password123",
    });
    const token = sessionRes.body.token;

    const createTeamRes = await request(app)
      .post("/teams")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Time Para Atualizar",
        description: "Descrição inicial do time",
      });

    const teamId = createTeamRes.body.team.id;
    createdTeamIds.push(teamId);

    const updateData = {
      name: "Time Atualizado",
      description: "Nova descrição atualizada com sucesso",
    };

    const updateRes = await request(app)
      .patch(`/teams/update/${teamId}`)
      .set("Authorization", `Bearer ${token}`)
      .send(updateData);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.message).toBe("Time atualizado com sucesso!");

    const updatedTeam = await prisma.team.findUnique({ where: { id: teamId } });
    expect(updatedTeam?.name).toBe(updateData.name);
    expect(updatedTeam?.description).toBe(updateData.description);
  });

  // REMOVE
  it("Removendo time!", async () => {
    const team = await prisma.team.create({
      data: {
        name: "Time Teste para remover",
        description: "Time apenas para teste de remoção",
      },
    });

    createdTeamIds.push(team.id);

    await prisma.team.deleteMany({
      where: { id: team.id },
    });
  });
});
