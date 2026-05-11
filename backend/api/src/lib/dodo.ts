import DodoPayments from "dodopayments";

export type BillingInterval = "monthly" | "annual";

// ─── Lazy client — only instantiated on first real use ────────────────────────

let _dodo: DodoPayments | null = null;

export function getDodoClient(): DodoPayments {
    if (_dodo) return _dodo;

    const key = process.env.DODO_API_KEY;
    if (!key || key.startsWith("your_")) {
        throw new Error(
            "Dodo Payments is not configured. " +
            "Set DODO_API_KEY in backend/.env. " +
            "Get your key at https://dashboard.dodopayments.com/settings/api-keys"
        );
    }

    const env = (process.env.DODO_ENVIRONMENT ?? "live_mode") as "live_mode" | "test_mode";

    _dodo = new DodoPayments({
        bearerToken: key,
        environment: env,
    });

    return _dodo;
}

// ─── Product ID helpers ───────────────────────────────────────────────────────

const PRODUCT_IDS: Record<string, Record<BillingInterval, string | undefined>> = {
    STARTER: {
        monthly: process.env.DODO_PRODUCT_STARTER_MONTHLY,
        annual:  process.env.DODO_PRODUCT_STARTER_ANNUAL,
    },
    GROWTH: {
        monthly: process.env.DODO_PRODUCT_GROWTH_MONTHLY,
        annual:  process.env.DODO_PRODUCT_GROWTH_ANNUAL,
    },
};

export function getProductId(plan: string, billing: BillingInterval): string {
    const id = PRODUCT_IDS[plan]?.[billing];
    if (!id || id.startsWith("your_")) {
        throw new Error(
            `Dodo product ID not configured for ${plan} (${billing}). ` +
            `Set DODO_PRODUCT_${plan}_${billing.toUpperCase()} in backend/.env. ` +
            `Create products at https://dashboard.dodopayments.com/products`
        );
    }
    return id;
}
