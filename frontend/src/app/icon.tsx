import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
    const imgData = readFileSync(join(process.cwd(), "public", "logo-removebg.png"));
    const base64 = `data:image/png;base64,${imgData.toString("base64")}`;

    return new ImageResponse(
        <div
            style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#ffffff",
            }}
        >
            <img src={base64} width={32} height={32} />
        </div>,
        { ...size }
    );
}
