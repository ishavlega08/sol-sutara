"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface LockedGateProps {
    type: "soon" | "paid";
    feature?: string;
}

export default function LockedGate({ type: _type, feature: _feature }: LockedGateProps) {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard");
    }, [router]);

    return null;
}
