import { prisma } from "../lib/prisma";

// ─── time-series (weekly buckets) ────────────────────────────────────────────

export interface TimeSeriesData {
    weeks:      string[];   // ISO date strings (Monday of each week)
    components: number[];
    links:      number[];
}

export async function getTimeSeries(orgId?: string, weeks = 14): Promise<TimeSeriesData> {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    // Build weekly buckets manually — avoids DATE_TRUNC dialect issues
    const buckets: { start: Date; end: Date; label: string }[] = [];
    const cursor = new Date(since);
    // align to Monday
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
    cursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < weeks; i++) {
        const start = new Date(cursor);
        cursor.setDate(cursor.getDate() + 7);
        const end = new Date(cursor);
        buckets.push({ start, end, label: start.toISOString().slice(0, 10) });
    }

    const [compRows, linkRows] = await Promise.all([
        prisma.component.findMany({
            where: {
                created_at: { gte: since },
                ...(orgId ? { org_id: orgId } : {}),
            },
            select: { created_at: true },
        }),
        prisma.componentLink.findMany({
            where: {
                created_at: { gte: since },
                ...(orgId ? { parent: { org_id: orgId } } : {}),
            },
            select: { created_at: true },
        }),
    ]);

    const compCounts = buckets.map(({ start, end }) =>
        compRows.filter((r) => r.created_at >= start && r.created_at < end).length
    );
    const linkCounts = buckets.map(({ start, end }) =>
        linkRows.filter((r) => r.created_at >= start && r.created_at < end).length
    );

    return {
        weeks:      buckets.map((b) => b.label),
        components: compCounts,
        links:      linkCounts,
    };
}

// ─── analytics service ────────────────────────────────────────────────────────

export interface AnalyticsResult {
    totalComponents:    number;
    totalLinks:         number;
    maxGraphDepth:      number;
    avgParentsPerNode:  number;
    mostReused:         Array<{ id: string; name: string; type: string; childCount: number }>;
    recallImpact:       Array<{ id: string; name: string; type: string; affectedCount: number }>;
    componentsByType:   Array<{ type: string; count: number }>;
    orgId:              string | null;
}

type Period = "7d" | "30d" | "90d" | "all";

function periodFilter(period: Period): Date | undefined {
    if (period === "all") return undefined;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
}

export async function getAnalytics(orgId?: string, period: Period = "all"): Promise<AnalyticsResult> {
    const since = periodFilter(period);
    const dateFilter = since ? { gte: since } : undefined;
    const where = {
        ...(orgId ? { org_id: orgId } : {}),
        ...(dateFilter ? { created_at: dateFilter } : {}),
    };

    // 1. total components & links
    const [totalComponents, totalLinks] = await Promise.all([
        prisma.component.count({ where }),
        prisma.componentLink.count({
            where: orgId
                ? { parent: { org_id: orgId } }
                : {},
        }),
    ]);

    // 2. components by type
    const byTypeRaw = await prisma.component.groupBy({
        by:     ["type"],
        where,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
    });
    const componentsByType = byTypeRaw.map((r) => ({ type: r.type, count: r._count.id }));

    // 3. most reused — components that appear most as a parent
    const parentCounts = await prisma.componentLink.groupBy({
        by:     ["parent_id"],
        where:  orgId ? { parent: { org_id: orgId } } : {},
        _count: { child_id: true },
        orderBy: { _count: { child_id: "desc" } },
        take:   5,
    });

    const mostReused = await Promise.all(
        parentCounts.map(async (r) => {
            const c = await prisma.component.findUnique({ where: { id: r.parent_id } });
            return {
                id:         r.parent_id,
                name:       c?.name ?? "Unknown",
                type:       c?.type ?? "Unknown",
                childCount: r._count.child_id,
            };
        })
    );

    // 4. recall impact — components whose downstream blast radius is largest
    //    we approximate by counting how many components have this as an ancestor
    //    using parent_id in componentLink (1-hop child count as a proxy for now)
    const childCounts = await prisma.componentLink.groupBy({
        by:     ["parent_id"],
        where:  orgId ? { parent: { org_id: orgId } } : {},
        _count: { child_id: true },
        orderBy: { _count: { child_id: "desc" } },
        take:   5,
    });

    const recallImpact = await Promise.all(
        childCounts.map(async (r) => {
            const c = await prisma.component.findUnique({ where: { id: r.parent_id } });
            return {
                id:            r.parent_id,
                name:          c?.name ?? "Unknown",
                type:          c?.type ?? "Unknown",
                affectedCount: r._count.child_id,
            };
        })
    );

    // 5. max graph depth — find the longest chain via BFS from roots (nodes with no parents)
    const maxGraphDepth = await computeMaxDepth(orgId);

    // 6. avg parents per node
    const avgParentsPerNode =
        totalComponents > 0
            ? Math.round((totalLinks / totalComponents) * 100) / 100
            : 0;

    return {
        totalComponents,
        totalLinks,
        maxGraphDepth,
        avgParentsPerNode,
        mostReused,
        recallImpact,
        componentsByType,
        orgId: orgId ?? null,
    };
}

// ─── helper: compute max graph depth ─────────────────────────────────────────
// BFS from every root node (component with no parents), track max depth reached

async function computeMaxDepth(orgId?: string): Promise<number> {
    const where = orgId ? { org_id: orgId } : {};

    // load all links for the org into memory (efficient for graph traversal)
    const allLinks = await prisma.componentLink.findMany({
        where: orgId ? { parent: { org_id: orgId } } : {},
        select: { parent_id: true, child_id: true },
    });

    // build adjacency list: parent → children
    const children = new Map<string, string[]>();
    const hasParent = new Set<string>();

    for (const link of allLinks) {
        if (!children.has(link.parent_id)) children.set(link.parent_id, []);
        children.get(link.parent_id)!.push(link.child_id);
        hasParent.add(link.child_id);
    }

    // root nodes = components with no parent
    const allComponents = await prisma.component.findMany({
        where,
        select: { id: true },
    });

    const roots = allComponents
        .map((c) => c.id)
        .filter((id) => !hasParent.has(id));

    if (roots.length === 0) return 0;

    let maxDepth = 0;
    const queue: Array<{ id: string; depth: number }> = roots.map((id) => ({ id, depth: 1 }));

    while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        if (depth > maxDepth) maxDepth = depth;

        for (const childId of children.get(id) ?? []) {
            queue.push({ id: childId, depth: depth + 1 });
        }
    }

    return maxDepth;
}
