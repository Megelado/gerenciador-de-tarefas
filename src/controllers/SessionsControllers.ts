import { Request, Response } from "express";
import { prisma } from "@/database/prisma";
import { z } from "zod";
import { AppError } from "@/utils/AppError";
import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { env } from "@/env";

class SessionsController {
  async create(request: Request, response: Response) {
    // Validação do body
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    });

    const { email, password } = bodySchema.parse(request.body);

    // Buscar usuário no banco
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new AppError("Email ou senha inválido", 401);
    }

    // Verificar senha
    const passwordMatched = await compare(password, user.password);
    if (!passwordMatched) {
      throw new AppError("Email ou senha inválido", 401);
    }

    // Gerar token JWT usando a variável de ambiente validada pelo Zod
    const token = sign(
      { role: user.role ?? "member" },
      env.JWT_SECRET, // já é garantido como string pelo Zod
      {
        subject: user.id,
        expiresIn: "1d",
      }
    );

    const {password: _hashedPassword, ...userWithoutPassword} = user;

    // Retornar resposta com token
    return response.status(200).json({token, ...userWithoutPassword});
  }
}

export { SessionsController };