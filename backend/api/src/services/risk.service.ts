import { prisma } from "../lib/prisma";

// ─── risk scoring engine ──────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskScore {
    componentId:      string;
    score:            number;        // 0–100
    level:            RiskLevel;
    factors: {
        parentCount:      number;    // how many components feed into this one
        childCount:       number;    // how many components depend on this one
        upstreamDepth:    number;    // longest chain of ancestors
        downstreamDepth:  number;    // longest chain of dependents
        reuseFrequency:   number;    // times this component is referenced as a parent
    };
    explanation: string[];
}

export async function scoreComponent(componentDbId: string): Promise<RiskScore> {
    const component = await prisma.component.findUnique({ where: { id: componentDbId } });
    if (!component) throw new Error(`Component not found: ${componentDbId}`);

    // load all links once for graph traversal
    const allLinks = await prisma.componentLink.findMany({
        select: { parent_id: true, child_id: true },
    });

    // build adjacency maps
    const childrenOf  = new Map<string, string[]>();   // parent → children
    const parentsOf   = new Map<string, string[]>();   // child  → parents

    for (const link of allLinks) {
        if (!childrenOf.has(link.parent_id)) childrenOf.set(link.parent_id, []);
        childrenOf.get(link.parent_id)!.push(link.child_id);

        if (!parentsOf.has(link.child_id)) parentsOf.set(link.child_id, []);
        parentsOf.get(link.child_id)!.push(link.parent_id);
    }

    const parentCount     = (parentsOf.get(componentDbId) ?? []).length;
    const childCount      = (childrenOf.get(componentDbId) ?? []).length;
    const reuseFrequency  = childCount;                // same as child count
    const upstreamDepth   = bfsDepth(componentDbId, parentsOf);
    const downstreamDepth = bfsDepth(componentDbId, childrenOf);

    // ── scoring formula ──────────────────────────────────────────────────────
    // Each factor contributes points (total out of 100):
    //   parentCount     (0–25):  more inputs  = more exposure
    //   childCount      (0–25):  more outputs = bigger blast radius
    //   upstreamDepth   (0–20):  deeper chain = harder to trace
    //   downstreamDepth (0–20):  deeper chain = bigger recall impact
    //   reuseFrequency  (0–10):  high reuse   = single point of failure risk

    const parentScore     = Math.min(parentCount     * 8,  25);
    const childScore      = Math.min(childCount      * 8,  25);
    const upScore         = Math.min(upstreamDepth   * 4,  20);
    const downScore       = Math.min(downstreamDepth * 4,  20);
    const reuseScore      = Math.min(reuseFrequency  * 3,  10);

    const score = parentScore + childScore + upScore + downScore + reuseScore;

    const level: RiskLevel =
        score >= 60 ? "HIGH" :
        score >= 30 ? "MEDIUM" :
        "LOW";

    const explanation = buildExplanation(level, {
        parentCount, childCount, upstreamDepth, downstreamDepth, reuseFrequency,
    });

    return {
        componentId: componentDbId,
        score,
        level,
        factors: { parentCount, childCount, upstreamDepth, downstreamDepth, reuseFrequency },
        explanation,
    };
}

// ─── helper: BFS depth in a direction ────────────────────────────────────────

function bfsDepth(startId: string, graph: Map<string, string[]>): number {
    let maxDepth = 0;
    const visited = new Set<string>([startId]);
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        if (depth > maxDepth) maxDepth = depth;

        for (const neighbor of graph.get(id) ?? []) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push({ id: neighbor, depth: depth + 1 });
            }
        }
    }

    return maxDepth;
}

// ─── helper: human-readable explanation ──────────────────────────────────────

function buildExplanation(
    level: RiskLevel,
    factors: {
        parentCount: number;
        childCount: number;
        upstreamDepth: number;
        downstreamDepth: number;
        reuseFrequency: number;
    }
): string[] {
    const lines: string[] = [];

    if (factors.parentCount > 2)
        lines.push(`High input exposure: fed by ${factors.parentCount} parent components`);
    if (factors.childCount > 2)
        lines.push(`Large blast radius: ${factors.childCount} downstream components depend on this`);
    if (factors.upstreamDepth > 3)
        lines.push(`Deep upstream chain (${factors.upstreamDepth} levels) makes tracing harder`);
    if (factors.downstreamDepth > 3)
        lines.push(`Deep downstream chain (${factors.downstreamDepth} levels) amplifies recall impact`);
    if (factors.reuseFrequency > 3)
        lines.push(`High reuse frequency (${factors.reuseFrequency}x) creates single-point-of-failure risk`);

    if (lines.length === 0) {
        lines.push(
            level === "LOW"
                ? "Few dependencies and limited downstream impact"
                : "Moderate dependencies detected"
        );
    }

    return lines;
}
