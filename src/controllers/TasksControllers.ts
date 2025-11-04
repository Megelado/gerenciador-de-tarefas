import { prisma } from "@/database/prisma";
import { Prisma } from "@prisma/client";
import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { z } from "zod";

class TasksController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      title: z.string(),
      description: z.string(),
      status: z.enum(["pending", "in_progress", "completed"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      user_id: z.string().uuid(),
      team_id: z.string().uuid()
    });

    const { title, description, status, priority, user_id, team_id } = bodySchema.parse(request.body);

    // Verifica se o usuário existe
    const userExists = await prisma.user.findUnique({ where: { id: user_id } });
    if (!userExists) {
      throw new AppError("Usuário não encontrado", 404);
    }

    // Verifica se o time existe
    const teamExists = await prisma.team.findUnique({ where: { id: team_id } });
    if (!teamExists) {
      throw new AppError("Time não encontrado", 404);
    }

    // Verifica se já existe a mesma tarefa para o mesmo usuário
    const existingTask = await prisma.task.findFirst({
      where: {
        title,
        assignedTo: user_id,
      },
    });

    if (existingTask) {
      throw new AppError("Esta tarefa já está atribuída a este usuário.", 400);
    }

    // Cria a tarefa
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        assignedTo: user_id,
        teamId: team_id
      }
    });

    response.status(201).json({ task });
  }


  async index(request: Request, response: Response) {
    const tasks = await prisma.task.findMany();

    return response.status(200).json({ tasks });
  }

  async updateAdmin(request: Request, response: Response) {
    const paramsSchema = z.object({
      task_id: z.string().uuid(),
    });

    const bodySchema = z.object({
      title: z.string().optional(),
      description: z.string().min(10).optional(),
      status: z.enum(["pending", "in_progress", "completed"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
    });

    const { task_id } = paramsSchema.parse(request.params);
    const { title, description, status, priority } = bodySchema.parse(request.body);

    const task = await prisma.task.findUnique({ where: { id: task_id } });
    if (!task) throw new AppError("Tarefa não encontrada", 404);

    const user = request.user;
    if (!user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    // Se o status mudou, cria o registro no histórico
    if (status && status !== task.status) {
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          changedBy: user.id,
          oldStatus: task.status,
          newStatus: status,
        },
      });
    }

    // Atualiza a task
    const updatedTask = await prisma.task.update({
      where: { id: task_id },
      data: { title, description, status, priority },
    });

    return response.status(200).json({ task: updatedTask });
  }


  async updateMember(request: Request, response: Response) {
    const paramsSchema = z.object({
      task_id: z.string().uuid(),
    });

    const bodySchema = z.object({
      title: z.string().optional(),
      description: z.string().min(10).optional(),
      status: z.enum(["pending", "in_progress", "completed"]).optional(),
      priority: z.enum(["low", "medium", "high"]).optional(),
    });

    const { task_id } = paramsSchema.parse(request.params);
    const { title, description, status, priority } = bodySchema.parse(request.body);

    const task = await prisma.task.findUnique({ where: { id: task_id } });
    if (!task) throw new AppError("Tarefa não encontrada", 404);

    // Só permite editar se o task.assignedTo for o próprio usuário
    const user = request.user;
    if (!user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    // Agora TypeScript sabe que user não é undefined
    if (user.role !== "admin" && task.assignedTo !== user.id) {
      throw new AppError("Você não tem permissão para atualizar esta tarefa.", 403);
    }


    const updatedTask = await prisma.task.update({
      where: { id: task_id },
      data: { title, description, status, priority },
    });

    if (status && status !== task.status) {
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          changedBy: user.id, // vem do token
          oldStatus: task.status,
          newStatus: status
        }
      });
    }

    return response.status(200).json({ task: updatedTask });
  }

  async remove(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);
    if (!id) {
      throw new AppError("Insira um id a ser removido!", 400);
    }

    try {
      await prisma.task.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError("Tarefa não encontrada ou já removida!", 404);
      }
      throw error;
    }

    return response.status(200).json({ message: "Tarefa removida com sucesso!" });
  }

  async filterByStatus(request: Request, response: Response) {
    const paramsSchema = z.object({
      status: z.enum(["pending", "in_progress", "completed"])
    });

    const { status } = paramsSchema.parse(request.params);
    const user = request.user;
    if (!user) throw new AppError("Usuário não autenticado", 401);

    let tasks;

    if (user.role === "admin") {
      // Admin vê todas
      tasks = await prisma.task.findMany({
        where: { status },
        include: {
          taskUser: { select: { name: true } },
          taskTeam: { select: { name: true } }
        }
      });
    } else {
      // Member vê apenas tarefas de times que participa
      const teamMemberships = await prisma.teamMember.findMany({
        where: { userId: user.id },
        select: { teamId: true }
      });

      const teamIds = teamMemberships.map(t => t.teamId);

      tasks = await prisma.task.findMany({
        where: {
          status,
          teamId: { in: teamIds }
        },
        include: {
          taskUser: { select: { name: true } },
          taskTeam: { select: { name: true } }
        }
      });
    }

    if (tasks.length === 0) {
      return response.status(404).json({
        message: `Nenhuma tarefa encontrada com status "${status}".`
      });
    }

    return response.status(200).json({ tasks });
  }


  async filterByPriority(request: Request, response: Response) {
    // Validação da URL: /tasks/status/:status
    const paramsSchema = z.object({
      priority: z.enum(["low", "medium", "high"])
    });

    const { priority } = paramsSchema.parse(request.params);

    const user = request.user;
    if (!user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    let tasks;

    if (user.role === "admin") {
      // Admin: busca todas as tasks com o status
      tasks = await prisma.task.findMany({
        where: { priority },
        include: {
          taskUser: { select: { name: true } }, // caso queira ver quem é responsável
          taskTeam: { select: { name: true } }
        }
      });
    } else {
      // Member: busca apenas tasks de times que ele faz parte
      tasks = await prisma.task.findMany({
        where: {
          priority,
          taskTeam: {
            team: {
              some: {
                userId: user.id
              }
            }
          }
        },
        include: {
          taskUser: { select: { name: true } },
          taskTeam: { select: { name: true } }
        }
      });
    }

    if (!tasks || tasks.length === 0) {
      return response.status(404).json({
        message: `Nenhuma tarefa encontrada com prioridade ${priority}.`
      });
    }

    return response.status(200).json({ tasks });
  }

}

export { TasksController };
