import { prisma } from "../lib/prisma";

// ─── dashboard stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
    totalComponents:  number;
    totalLinks:       number;
    maxGraphDepth:    number;
    highRiskCount:    number;   // components with 3+ children (proxy for high impact)
    activeRecallCount: number;
    recentActivity:   ActivityItem[];
}

export interface ActivityItem {
    type:  "CREATE" | "LINK";
    label: string;
    time:  string;   // relative time string
    id:    string;
}

export async function getDashboardStats(orgId?: string): Promise<DashboardStats> {
    if (!orgId) return { totalComponents: 0, totalLinks: 0, maxGraphDepth: 0, highRiskCount: 0, activeRecallCount: 0, recentActivity: [] };
    const where = { org_id: orgId };
    const linkWhere = { parent: { org_id: orgId } };

    const [totalComponents, totalLinks, activeRecallCount, recentComponents, recentLinks] = await Promise.all([
        prisma.component.count({ where }),
        prisma.componentLink.count({ where: linkWhere }),
        prisma.recall.count({ where: { status: "ACTIVE", org_id: orgId } }),
        prisma.component.findMany({
            where,
            orderBy: { created_at: "desc" },
            take: 5,
            select: { id: true, name: true, type: true, created_at: true },
        }),
        prisma.componentLink.findMany({
            where: linkWhere,
            orderBy: { created_at: "desc" },
            take: 5,
            include: {
                parent: { select: { name: true } },
                child:  { select: { name: true } },
            },
        }),
    ]);

    // high-risk proxy: components that are parents of 3+ children
    const parentCounts = await prisma.componentLink.groupBy({
        by:     ["parent_id"],
        where:  linkWhere,
        _count: { child_id: true },
        having: { child_id: { _count: { gte: 3 } } },
    });
    const highRiskCount = parentCounts.length;

    // max graph depth (reuse same BFS from analytics)
    const allLinks = await prisma.componentLink.findMany({
        where: linkWhere,
        select: { parent_id: true, child_id: true },
    });
    const childrenOf = new Map<string, string[]>();
    const hasParent  = new Set<string>();
    for (const l of allLinks) {
        if (!childrenOf.has(l.parent_id)) childrenOf.set(l.parent_id, []);
        childrenOf.get(l.parent_id)!.push(l.child_id);
        hasParent.add(l.child_id);
    }
    const allIds = await prisma.component.findMany({ where, select: { id: true } });
    const roots  = allIds.map((c) => c.id).filter((id) => !hasParent.has(id));
    let maxGraphDepth = 0;
    const bfsQueue: Array<{ id: string; depth: number }> = roots.map((id) => ({ id, depth: 1 }));
    while (bfsQueue.length > 0) {
        const { id, depth } = bfsQueue.shift()!;
        if (depth > maxGraphDepth) maxGraphDepth = depth;
        for (const child of childrenOf.get(id) ?? []) bfsQueue.push({ id: child, depth: depth + 1 });
    }

    // merge and sort activity items
    const createItems: ActivityItem[] = recentComponents.map((c) => ({
        type:  "CREATE",
        label: `${c.name} created`,
        time:  relativeTime(c.created_at),
        id:    c.id,
    }));
    const linkItems: ActivityItem[] = recentLinks.map((l) => ({
        type:  "LINK",
        label: `${l.parent.name} → ${l.child.name} linked`,
        time:  relativeTime(l.created_at),
        id:    l.id,
    }));
    const recentActivity = [...createItems, ...linkItems]
        .sort((a, b) => {
            // sort by the numeric seconds embedded in relative time (rough)
            return a.time.localeCompare(b.time);
        })
        .slice(0, 8);

    return { totalComponents, totalLinks, maxGraphDepth, highRiskCount, activeRecallCount, recentActivity };
}

function relativeTime(date: Date): string {
    const diffMs  = Date.now() - new Date(date).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60)  return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60)  return `${diffMin}m ago`;
    const diffH   = Math.floor(diffMin / 60);
    if (diffH < 24)    return `${diffH}h ago`;
    const diffD   = Math.floor(diffH / 24);
    return `${diffD}d ago`;
}

// ─── recent links ─────────────────────────────────────────────────────────────

export interface RecentLink {
    id:         string;
    parentId:   string;
    parentName: string;
    childId:    string;
    childName:  string;
    txHash:     string;
    createdAt:  string;
    when:       string;
}

export async function getRecentLinks(orgId?: string, limit = 10): Promise<RecentLink[]> {
    if (!orgId) return [];
    const links = await prisma.componentLink.findMany({
        where:   { parent: { org_id: orgId } },
        orderBy: { created_at: "desc" },
        take:    limit,
        include: {
            parent: { select: { id: true, name: true } },
            child:  { select: { id: true, name: true } },
        },
    });

    return links.map((l) => ({
        id:         l.id,
        parentId:   l.parent_id,
        parentName: l.parent.name,
        childId:    l.child_id,
        childName:  l.child.name,
        txHash:     l.tx_hash,
        createdAt:  l.created_at.toISOString(),
        when:       relativeTime(l.created_at),
    }));
}

// ─── all links (for graph rendering) ─────────────────────────────────────────

export interface OrgLink {
    id:       string;
    parentId: string;
    childId:  string;
    txHash:   string;
}

export async function getAllLinks(orgId?: string): Promise<OrgLink[]> {
    if (!orgId) return [];
    const links = await prisma.componentLink.findMany({
        where:   { parent: { org_id: orgId } },
        select:  { id: true, parent_id: true, child_id: true, tx_hash: true },
        orderBy: { created_at: "asc" },
    });
    return links.map((l) => ({
        id:       l.id,
        parentId: l.parent_id,
        childId:  l.child_id,
        txHash:   l.tx_hash,
    }));
}

// ─── batch risk (lightweight — based on link counts, no full graph walk) ──────

export interface ComponentRiskSummary {
    id:         string;
    name:       string;
    score:      number;
    level:      "LOW" | "MEDIUM" | "HIGH";
}

export async function getBatchRisk(orgId?: string): Promise<ComponentRiskSummary[]> {
    if (!orgId) return [];
    const [components, parentCounts, childCounts] = await Promise.all([
        prisma.component.findMany({ where: { org_id: orgId }, select: { id: true, name: true } }),
        prisma.componentLink.groupBy({
            by:     ["child_id"],
            where:  { child: { org_id: orgId } },
            _count: { parent_id: true },
        }),
        prisma.componentLink.groupBy({
            by:     ["parent_id"],
            where:  { parent: { org_id: orgId } },
            _count: { child_id: true },
        }),
    ]);

    const parentCountMap = new Map(parentCounts.map((r) => [r.child_id,   r._count.parent_id]));
    const childCountMap  = new Map(childCounts.map((r)  => [r.parent_id,  r._count.child_id]));

    return components.map((c) => {
        const parents  = parentCountMap.get(c.id) ?? 0;
        const children = childCountMap.get(c.id)  ?? 0;
        const score    = Math.min(parents * 12 + children * 13, 100);
        const level: "LOW" | "MEDIUM" | "HIGH" = score >= 60 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";
        return { id: c.id, name: c.name, score, level };
    });
}
