import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./trpc";

/**
 * Admin-only procedure
 * Requires user to be authenticated AND have admin role
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // user is guaranteed to be admin here
    },
  });
});
