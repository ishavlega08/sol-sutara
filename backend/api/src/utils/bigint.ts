// JSON.stringify has no built-in BigInt support.
// Prisma returns on_chain_id as BigInt (PostgreSQL BIGINT → JS BigInt).
// This patch converts any BigInt to a string during serialization.
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};
