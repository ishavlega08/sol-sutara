import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/auth";

export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;
}
