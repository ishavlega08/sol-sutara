import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MEMBERS = [
  { name: "Ava Patel", email: "ava@meridian.ev", role: "Owner", tone: "purple", wallet: "8Jk2…p9Qp", last: "now", initials: "AP" },
  { name: "Ravi Singh", email: "ravi@meridian.ev", role: "Admin", tone: "accent", wallet: "5Fm1…k7Xy", last: "2h ago", initials: "RS" },
  { name: "Jamie Kim", email: "jamie@meridian.ev", role: "Member", tone: "teal", wallet: "—", last: "1d ago", initials: "JK" },
];

export default function MembersPage() {
  return (
    <div className="p-8 pb-16 max-w-[1400px]">
      <div className="flex justify-between items-start gap-6 mb-6 pb-5 border-b border-border">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-fg-muted text-[13.5px] mt-1">3 active · 5 seats included on Starter</p>
        </div>
        <Button variant="primary">+ Invite member</Button>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="bg-bg-elev-2/50">{["","Name","Email","Role","Wallet","Last active",""].map(h => (
            <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-wider text-fg-dim font-medium border-b border-border">{h}</th>
          ))}</tr></thead>
          <tbody>
            {MEMBERS.map(m => (
              <tr key={m.email} className="border-b border-border last:border-0">
                <td className="px-3.5 py-3"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-3 to-accent-2 text-white text-[11px] font-mono font-semibold grid place-items-center">{m.initials}</div></td>
                <td className="px-3.5 py-3">{m.name}</td>
                <td className="px-3.5 py-3">{m.email}</td>
                <td className="px-3.5 py-3"><Badge tone={m.tone as any}>{m.role}</Badge></td>
                <td className="px-3.5 py-3 font-mono text-[11px]">{m.wallet}</td>
                <td className="px-3.5 py-3 text-fg-dim">{m.last}</td>
                <td className="px-3.5 py-3 text-right"><Button size="sm">···</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
