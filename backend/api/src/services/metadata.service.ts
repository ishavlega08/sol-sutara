export interface ComponentMetadata {
    name: string;
    type: string;
    supplier?: string;
    attributes: Record<string, unknown>;
    createdAt: string;
}

export const buildMetadata = (
    name: string,
    type: string,
    supplier: string | undefined,
    attributes: Record<string, unknown>
): ComponentMetadata => {
    return {
        name,
        type,
        supplier,
        attributes,
        createdAt: new Date().toISOString(),
    };
}