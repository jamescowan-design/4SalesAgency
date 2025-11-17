import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import * as tasksDb from "../../db/tasks";

const createTaskSchema = z.object({
  leadId: z.number().optional(),
  campaignId: z.number().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  taskType: z.enum(["call", "email", "meeting", "follow_up", "research", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
});

export const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return tasksDb.getTasksByUser(ctx.user.id);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return tasksDb.getTaskById(input.id);
    }),

  getByLead: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      return tasksDb.getTasksByLead(input.leadId);
    }),

  getByCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      return tasksDb.getTasksByCampaign(input.campaignId);
    }),

  getOverdue: protectedProcedure.query(async ({ ctx }) => {
    return tasksDb.getOverdueTasks(ctx.user.id);
  }),

  getUpcoming: protectedProcedure
    .input(z.object({ days: z.number().default(7) }))
    .query(async ({ ctx, input }) => {
      return tasksDb.getUpcomingTasks(ctx.user.id, input.days);
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    return tasksDb.getTaskStats(ctx.user.id);
  }),

  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const taskId = await tasksDb.createTask({
        ...input,
        userId: ctx.user.id,
        status: "pending",
      });
      return { id: taskId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: createTaskSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      await tasksDb.updateTask(input.id, input.data);
      return { success: true };
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await tasksDb.completeTask(input.id);
      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      await tasksDb.updateTask(input.id, { status: input.status });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await tasksDb.deleteTask(input.id);
      return { success: true };
    }),
});
