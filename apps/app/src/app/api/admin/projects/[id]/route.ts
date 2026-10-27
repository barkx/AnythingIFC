import { bearerIsAdmin } from "@/lib/admin-auth";
import { ID_PATTERN } from "@/lib/blob-paths";
import { ConfigError } from "@/lib/env";
import { readProject, toPublic } from "@/lib/projects";

// Used by `ifc-tools pull <id>`: public project data incl. input file URLs (no email, no token hash).
export async function GET(request: Request, { params }: RouteContext<"/api/admin/projects/[id]">): Promise<Response> {
  try {
    if (!bearerIsAdmin(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    if (!ID_PATTERN.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
    const loaded = await readProject(id);
    if (!loaded) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(toPublic(loaded.project));
  } catch (error) {
    const status = error instanceof ConfigError ? 503 : 500;
    return Response.json({ error: error instanceof Error ? error.message : "Error" }, { status });
  }
}
