import { prisma } from "@/database/prisma";
import { Request, Response } from "express";
import { z } from "zod";

class TasksHistoryController {
  async index(request: Request, response: Response) {
    const paramsSchema = z.object({
      task_id: z.string().uuid()
    });

    const { task_id } = paramsSchema.parse(request.params);

    const task_history = await prisma.taskHistory.findMany({
      where: {
        taskId: task_id
      }
    });

    if((await task_history).length === 0){
      return response.json("Não há histórico de mudanças de status para essa tarefa!");
    }

    return response.status(200).json(task_history);
  }
}

export { TasksHistoryController };
