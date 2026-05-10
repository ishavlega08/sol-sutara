import { prisma } from "../../lib/prisma";
import { sendEmail, shipmentStatusTemplate, supplierStatusTemplate } from "./email.client";

// ─── create in-app notification ───────────────────────────────────────────────

export async function createNotification(params: {
    userId:    string;
    orgId:     string;
    title:     string;
    body:      string;
    type:      string;
    entityId?: string;
}) {
    return prisma.notification.create({
        data: {
            user_id:   params.userId,
            org_id:    params.orgId,
            title:     params.title,
            body:      params.body,
            type:      params.type,
            entity_id: params.entityId ?? null,
        },
    });
}

// ─── notify all org members (or filtered by role) ────────────────────────────

export async function notifyOrgMembers(params: {
    orgId:     string;
    title:     string;
    body:      string;
    type:      string;
    entityId?: string;
    roles?:    string[];       // if omitted, notifies all members
    sendEmailTo?: string[];    // explicit email addresses to email
}) {
    const memberWhere = {
        org_id: params.orgId,
        ...(params.roles?.length ? { role: { in: params.roles as any[] } } : {}),
    };

    const members = await prisma.organizationMember.findMany({
        where:   memberWhere,
        include: { user: { select: { id: true, email: true } } },
    });

    if (members.length === 0) return;

    // Bulk create in-app notifications
    await prisma.notification.createMany({
        data: members.map((m) => ({
            user_id:   m.user.id,
            org_id:    params.orgId,
            title:     params.title,
            body:      params.body,
            type:      params.type,
            entity_id: params.entityId ?? null,
        })),
        skipDuplicates: true,
    });

    // Email delivery (fire-and-forget, non-fatal)
    const emailTargets = params.sendEmailTo
        ?? members.map((m) => m.user.email).filter((e): e is string => !!e);

    if (emailTargets.length > 0) {
        sendEmail({
            to:      emailTargets,
            subject: params.title,
            html:    `<p>${params.body}</p>`,
        }).catch((err) => console.error("[notification] email send failed:", err));
    }
}

// ─── shipment status change notification ─────────────────────────────────────

export async function notifyShipmentStatusChange(params: {
    orgId:          string;
    shipmentNumber: string;
    shipmentId:     string;
    status:         string;
    origin:         string;
    destination:    string;
    notes?:         string;
    location?:      string;
    emailTargets?:  string[];
}) {
    const { subject, html } = shipmentStatusTemplate({
        shipmentNumber: params.shipmentNumber,
        status:         params.status,
        origin:         params.origin,
        destination:    params.destination,
        notes:          params.notes,
        location:       params.location,
    });

    const statusLabel = params.status.replace(/_/g, " ");

    await notifyOrgMembers({
        orgId:        params.orgId,
        title:        `Shipment ${params.shipmentNumber}: ${statusLabel}`,
        body:         `${params.origin} → ${params.destination}${params.location ? ` · Now at: ${params.location}` : ""}`,
        type:         `shipment_${params.status.toLowerCase()}`,
        entityId:     params.shipmentId,
        roles:        ["OWNER", "ADMIN", "MEMBER"],
        sendEmailTo:  params.emailTargets,
    });
}

// ─── supplier status change notification ─────────────────────────────────────

export async function notifySupplierStatusChange(params: {
    orgId:        string;
    supplierId:   string;
    supplierName: string;
    supplierCode: string;
    status:       string;
    emailTargets?: string[];
}) {
    const { subject, html } = supplierStatusTemplate({
        supplierName: params.supplierName,
        supplierCode: params.supplierCode,
        status:       params.status,
    });

    const statusLabel = params.status.replace(/_/g, " ");

    await notifyOrgMembers({
        orgId:       params.orgId,
        title:       `Supplier ${params.supplierCode}: ${statusLabel}`,
        body:        `${params.supplierName} status changed to ${statusLabel}`,
        type:        `supplier_${params.status.toLowerCase()}`,
        entityId:    params.supplierId,
        roles:       ["OWNER", "ADMIN"],
        sendEmailTo: params.emailTargets,
    });
}

// ─── get notifications for user ───────────────────────────────────────────────

export async function getUserNotifications(userId: string, orgId: string, unreadOnly = false) {
    return prisma.notification.findMany({
        where: {
            user_id: userId,
            org_id:  orgId,
            ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { created_at: "desc" },
        take: 50,
    });
}

// ─── get unread count ─────────────────────────────────────────────────────────

export async function getUnreadCount(userId: string, orgId: string): Promise<number> {
    return prisma.notification.count({
        where: { user_id: userId, org_id: orgId, read: false },
    });
}

// ─── mark as read ─────────────────────────────────────────────────────────────

export async function markNotificationRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({ where: { id, user_id: userId } });
    if (!notification) throw new Error(`Notification not found: ${id}`);

    return prisma.notification.update({ where: { id }, data: { read: true } });
}

// ─── mark all as read ─────────────────────────────────────────────────────────

export async function markAllNotificationsRead(userId: string, orgId: string) {
    await prisma.notification.updateMany({
        where: { user_id: userId, org_id: orgId, read: false },
        data:  { read: true },
    });
}
