import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { prisma } from "@/database/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

class TeamsController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z.string().trim().min(2),
      description: z.string().trim().min(10)
    });

    const { name, description } = bodySchema.parse(request.body);

    const userWithSameName = await prisma.team.findFirst({ where: { name } });

    if (userWithSameName) {
      throw new AppError("Um time com esse nome já existe!", 409);
    }

    const team = await prisma.team.create({
      data: {
        name,
        description
      }
    });

    return response.status(201).json({team});
  }

  async index(request: Request, response: Response) {
    const teams = await prisma.team.findMany();

    return response.json("teams");
  }

  async tasksTeam(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid()
    });
    const { id } = paramsSchema.parse(request.params);

    const user = request.user; // Assumindo que o ensureAuthenticated preenche isso

    if (!user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    // Verifica se o usuário é membro do time
    if (user.role !== "admin") {
      const isMember = await prisma.team.findFirst({
        where: {
          id,
          team: {
            some: {
              userId: user.id
            }
          }
        }
      });

      if (!isMember) {
        throw new AppError("Você não tem permissão para visualizar esse time", 403);
      }

    }

    // Busca todas as tasks do time
    const tasksTeam = await prisma.team.findUnique({
      where: { id },
      include: {
        teamTask: {
          select: {
            title: true,
            description: true,
            status: true,
            priority: true,
          }
        }
      }
    });

    return response.status(200).json(tasksTeam);
  }

  async update(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      name: z.string(),
      description: z.string().min(10)
    });

    const { id } = paramsSchema.parse(request.params);
    const { name, description } = bodySchema.parse(request.body);

    await prisma.team.update({
      where: {
        id,
      },
      data: {
        name,
        description,
      }
    });

    return response.status(200).json({ message: "Time atualizado com sucesso!" });
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
      await prisma.team.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError("Time não encontrado ou já removido!", 404);
      }
      throw error;
    }

    return response.status(202).json({ message: "Time removido com sucesso!" });
  }
}

export { TeamsController };
