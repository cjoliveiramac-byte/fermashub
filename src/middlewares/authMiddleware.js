import { requireAuth } from "@/middlewares/auth";

export async function authMiddleware() {
  return requireAuth();
}
