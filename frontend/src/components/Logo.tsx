import Image from "next/image";

interface LogoProps {
    /** Height in px — width scales automatically (logo is ~3:4 ratio) */
    size?: number;
    className?: string;
}

/**
 * Sol Sutara brand logo.
 * Used in Navbar, Login, Onboarding, Invite, Landing page, and Footer.
 */
export default function Logo({ size = 28, className = "" }: LogoProps) {
    return (
        <Image
            src="/logo.jpg"
            alt="Sol Sutara"
            width={size}
            height={Math.round(size * 1.33)}
            className={`dark:invert ${className}`.trim()}
            style={{ borderRadius: 4 }}
            priority
        />
    );
}

// Named export for backwards compatibility
export { Logo };
