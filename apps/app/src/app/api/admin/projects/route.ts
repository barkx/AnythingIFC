import { bearerIsAdmin } from "@/lib/admin-auth";
import { ConfigError } from "@/lib/env";
import { listAllProjects } from "@/lib/project-list";

// Used by `ifc-tools list`. Auth: Authorization: Bearer <ADMIN_API_TOKEN>.
export async function GET(request: Request): Promise<Response> {
  try {
    if (!bearerIsAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const projects = await listAllProjects();
    return Response.json(
      projects.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        published: p.published,
        createdAt: p.createdAt,
        inputs: p.inputs.length,
        outputs: p.outputs.length,
      })),
    );
  } catch (error) {
    const status = error instanceof ConfigError ? 503 : 500;
    return Response.json({ error: error instanceof Error ? error.message : "Error" }, { status });
  }
}
