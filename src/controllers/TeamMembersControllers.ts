import { prisma } from "@/database/prisma";
import { Prisma } from "@prisma/client";
import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import { z } from "zod";

class TeamMembersController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      user_id: z.string().uuid(),
      team_id: z.string().uuid()
    });

    const { user_id, team_id } = bodySchema.parse(request.body);
    const user = await prisma.user.findUnique({
      where: { id: user_id }
    });
    const team = await prisma.team.findUnique({
      where: { id: team_id }
    });

    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    if (!team) {
      throw new AppError("Time não encontrado", 404);
    }

    await prisma.teamMember.create({
      data: {
        userId: user_id,
        teamId: team_id,
      }
    });

    response.status(201).json("Membro do time cadastrado");


  }

  async index(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.string().uuid()
    });

    const { id } = paramsSchema.parse(request.params);

    // Busca todos os membros do time com esse id
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    // Caso não encontre ninguém
    if (teamMembers.length === 0) {
      throw new AppError("Nenhum membro encontrado para esse time", 404);
    }

    return response.status(200).json(teamMembers);
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
      await prisma.teamMember.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError("Membro do time não encontrado ou já removido!", 404);
      }
      throw error;
    }

    return response.status(202).json({ message: "Membro do time removido com sucesso!" });
  }
}

export { TeamMembersController };
