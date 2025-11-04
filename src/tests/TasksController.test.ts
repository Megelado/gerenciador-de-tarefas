import request from "supertest";
import { prisma } from "@/database/prisma";
import { app } from "@/app";

describe("TasksController", () => {
  let createdUsers: string[] = [];
  let createdTeams: string[] = [];
  let createdTasks: string[] = [];
  let createdTaskHistories: string[] = [];

  afterAll(async () => {
    try {
      // 0. Deleta histórico das tasks
      if (createdTaskHistories.length > 0) {
        await prisma.taskHistory.deleteMany({
          where: { id: { in: createdTaskHistories.filter(Boolean) } },
        });
      }

      // 1. Deleta tasks
      if (createdTasks.length > 0) {
        await prisma.task.deleteMany({
          where: { id: { in: createdTasks.filter(Boolean) } },
        });
      }

      // 2. Deleta team_members
      if (createdUsers.length > 0 || createdTeams.length > 0) {
        await prisma.teamMember.deleteMany({
          where: {
            OR: [
              { userId: { in: createdUsers.filter(Boolean) } },
              { teamId: { in: createdTeams.filter(Boolean) } },
            ],
          },
        });
      }

      // 3. Deleta teams
      if (createdTeams.length > 0) {
        await prisma.team.deleteMany({
          where: { id: { in: createdTeams.filter(Boolean) } },
        });
      }

      // 4. Deleta usuários
      if (createdUsers.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUsers.filter(Boolean) } },
        });
      }
    } catch (error) {
      console.error("Erro ao limpar dados no afterAll:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

  // -----------------------
  // CRIAÇÃO DE TASK PARA ADMIN
  // -----------------------
  it("Criando tarefas para o time (admin)", async () => {
    // Cria usuário admin
    const userRes = await request(app).post("/users").send({
      name: "Admin Task Test",
      email: "admin_task_test@example.com",
      password: "password123",
      role: "admin",
    });

    const userId = userRes.body.userWithoutPassword?.id || userRes.body.id;
    createdUsers.push(userId);

    // Login
    const sessionRes = await request(app).post("/sessions").send({
      email: "admin_task_test@example.com",
      password: "password123",
    });
    const { token } = sessionRes.body;

    // Cria team
    const teamRes = await request(app)
      .post("/teams")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Team Admin", description: "Time do Admin" });

    const teamId = teamRes.body.team?.id || teamRes.body.id;
    if (!teamId) throw new Error("Falha ao criar o time");
    createdTeams.push(teamId);

    // Adiciona usuário ao team
    await prisma.teamMember.create({
      data: { userId, teamId },
    });

    // Cria task
    const taskRes = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Implementar página de login",
        description: "Criar interface de login",
        status: "pending",
        priority: "high",
        user_id: userId,
        team_id: teamId,
      });

    createdTasks.push(taskRes.body.task.id);
    expect(taskRes.status).toBe(201);
  });

  // -----------------------
  // LISTAR TASKS
  // -----------------------
  it("Listar todas as tarefas", async () => {
    const sessionRes = await request(app).post("/sessions").send({
      email: "admin_task_test@example.com",
      password: "password123",
    });
    const { token } = sessionRes.body;

    const res = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("tasks");
  });

  // -----------------------
  // ATUALIZAÇÃO ADMIN
  // -----------------------
  it("Admin atualiza qualquer task", async () => {
    const sessionRes = await request(app).post("/sessions").send({
      email: "admin_task_test@example.com",
      password: "password123",
    });
    const { token } = sessionRes.body;

    const taskId = createdTasks[0];

    const updateRes = await request(app)
      .patch(`/tasks/admin/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Task atualizada pelo admin",
        status: "completed",
        priority: "medium",
      });

    const histories = await prisma.taskHistory.findMany({
      where: { taskId },
    });
    histories.forEach(h => createdTaskHistories.push(h.id));

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.task.title).toBe("Task atualizada pelo admin");
    expect(updateRes.body.task.status).toBe("completed");
    expect(updateRes.body.task.priority).toBe("medium");
  });

  // -----------------------
  // ATUALIZAÇÃO MEMBER
  // -----------------------
  // UPDATE MEMBER
  it("Member atualiza apenas sua própria task", async () => {
    // 1. Cria o member
    const userRes = await request(app).post("/users").send({
      name: "Member Test",
      email: "member_test@example.com",
      password: "password123",
      role: "member",
    });
    const userId = userRes.body.userWithoutPassword?.id || userRes.body.id;
    createdUsers.push(userId);

    // 2. Login do member
    const sessionRes = await request(app).post("/sessions").send({
      email: "member_test@example.com",
      password: "password123",
    });
    const { token } = sessionRes.body;

    // 3. Login do admin (já criado no teste anterior)
    const adminSession = await request(app).post("/sessions").send({
      email: "admin_task_test@example.com",
      password: "password123",
    });
    const adminToken = adminSession.body.token;

    // 4. Cria o time usando o admin
    const teamRes = await request(app)
      .post("/teams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Team Member", description: "Time do membro" });

    const teamId = teamRes.body.team?.id || teamRes.body.id;
    if (!teamId) throw new Error("Falha ao criar o time");
    createdTeams.push(teamId);

    // 5. Adiciona o member ao time
    await prisma.teamMember.create({
      data: { userId, teamId },
    });

    // 6. Cria uma task para esse member
    const task = await prisma.task.create({
      data: {
        title: "Task do member",
        description: "Descrição da task do membro",
        status: "pending",
        priority: "low",
        assignedTo: userId,
        teamId,
      },
    });
    createdTasks.push(task.id);

    // 7. Atualiza a task como member
    const updateRes = await request(app)
      .patch(`/tasks/member/${task.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Task atualizada pelo member",
        status: "in_progress",
        priority: "medium",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.task.title).toBe("Task atualizada pelo member");
    expect(updateRes.body.task.status).toBe("in_progress");
    expect(updateRes.body.task.priority).toBe("medium");

    // 8. Pega o histórico criado
    const historyRecords = await prisma.taskHistory.findMany({
      where: { taskId: task.id },
    });
    historyRecords.forEach(record => createdTaskHistories.push(record.id));
  });


  // -----------------------
  // REMOÇÃO DE TASK
  // -----------------------
  it("Remover uma tarefa", async () => {
    const userRes = await request(app).post("/users").send({
      name: "Remove Test",
      email: "remove_test@example.com",
      password: "password123",
      role: "admin",
    });
    const userId = userRes.body.userWithoutPassword?.id || userRes.body.id;
    createdUsers.push(userId);

    const sessionRes = await request(app).post("/sessions").send({
      email: "remove_test@example.com",
      password: "password123",
    });
    const { token } = sessionRes.body;

    const teamRes = await request(app)
      .post("/teams")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Team Remove", description: "Time Remove" });

    const teamId = teamRes.body.team?.id || teamRes.body.id;
    if (!teamId) throw new Error("Falha ao criar o time");
    createdTeams.push(teamId);

    await prisma.teamMember.create({ data: { userId, teamId } });

    const task = await prisma.task.create({
      data: {
        title: "Task para remover",
        description: "Descrição da task para remover",
        status: "pending",
        priority: "high",
        assignedTo: userId,
        teamId,
      },
    });
    createdTasks.push(task.id);

    const deleteRes = await request(app)
      .delete(`/tasks/${task.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
  });

  // -----------------------
  // FILTROS
  // -----------------------
  const filterTests = [
    { type: "status", value: "pending", noDataMessage: "Nenhuma tarefa encontrada com status \"pending\"." },
    { type: "priority", value: "low", noDataMessage: "Nenhuma tarefa encontrada com prioridade low." },
  ];

  filterTests.forEach(({ type, value, noDataMessage }) => {
    it(`Filtrar tarefas por ${type} quando não há tasks`, async () => {
      const sessionRes = await request(app).post("/sessions").send({
        email: "admin_task_test@example.com",
        password: "password123",
      });
      const { token } = sessionRes.body;

      const res = await request(app)
        .get(`/tasks/${type}/${value}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toBe(noDataMessage);
    });
  });
});
