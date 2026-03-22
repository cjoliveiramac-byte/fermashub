import { requireRole } from "@/middlewares/auth";

export function roleMiddleware(session, roles) {
  return requireRole(session, roles);
}
