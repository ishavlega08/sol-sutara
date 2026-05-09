// Mock sample data (multi-industry: EV + Pharma + Food)
export type Risk = "low" | "medium" | "high";
export type Component = {
  id: string;
  name: string;
  type: "Raw" | "Component" | "Subassembly" | "Product";
  org: string;
  risk: Risk;
  riskScore: number;
  parents: string[];
  children: string[];
  createdAt: string;
  metadataUri: string;
  metadataHash: string;
  txSig: string;
  cnft: string;
  industry: "Automotive" | "Pharma" | "Food";
};

export const COMPONENTS: Component[] = [
  { id: "SP-01", name: "Lithium · Chile salar", type: "Raw", org: "org:aster", risk: "low", riskScore: 18, parents: [], children: ["CM-18","CM-24"], createdAt: "Apr 18 2026", metadataUri: "shdw://li-chile-s1.json", metadataHash: "0x9f21…ab3c", txSig: "2pF9…mN3h", cnft: "cNFT·7Hq1…p9Qp", industry: "Automotive" },
  { id: "SP-02", name: "Cobalt · DRC b-881", type: "Raw", org: "org:aster", risk: "high", riskScore: 84, parents: [], children: ["CM-18","CM-31"], createdAt: "Apr 18 2026", metadataUri: "shdw://co-drc-b881.json", metadataHash: "0x4a8b…c2f1", txSig: "8Jk2…xp2v", cnft: "cNFT·9Q2p…mFfE", industry: "Automotive" },
  { id: "SP-03", name: "Nickel · Indonesia", type: "Raw", org: "org:kaldera", risk: "medium", riskScore: 52, parents: [], children: ["CM-31"], createdAt: "Apr 17 2026", metadataUri: "shdw://ni-id-2.json", metadataHash: "0x1e33…7b91", txSig: "4Mm9…2qLp", cnft: "cNFT·3vP8…k7Xy", industry: "Automotive" },
  { id: "SP-04", name: "Graphite · CN", type: "Raw", org: "org:kaldera", risk: "low", riskScore: 22, parents: [], children: ["CM-24"], createdAt: "Apr 17 2026", metadataUri: "shdw://gr-cn-3.json", metadataHash: "0x7c44…8d02", txSig: "6Nn3…9xKp", cnft: "cNFT·5Rs1…j2Wy", industry: "Automotive" },
  { id: "CM-18", name: "Cathode B-18", type: "Component", org: "org:kaldera", risk: "medium", riskScore: 65, parents: ["SP-01","SP-02"], children: ["AS-07"], createdAt: "Apr 14 2026", metadataUri: "shdw://cathode-b18-881.json", metadataHash: "0x4a8b…c2f1", txSig: "2pF9…mN3h", cnft: "cNFT·9Q2p…mFfE", industry: "Automotive" },
  { id: "CM-24", name: "Anode A-24", type: "Component", org: "org:kaldera", risk: "low", riskScore: 28, parents: ["SP-04","SP-01"], children: ["AS-07","AS-09"], createdAt: "Apr 14 2026", metadataUri: "shdw://anode-a24.json", metadataHash: "0x8f12…3b44", txSig: "7Ht2…p3Lm", cnft: "cNFT·4Jk8…n5Pq", industry: "Automotive" },
  { id: "CM-31", name: "Cell · NMC-811", type: "Component", org: "org:kaldera", risk: "low", riskScore: 34, parents: ["SP-02","SP-03"], children: ["AS-09"], createdAt: "Apr 12 2026", metadataUri: "shdw://cell-nmc811.json", metadataHash: "0x5a66…9c77", txSig: "3Gy1…8fVc", cnft: "cNFT·6Uu9…k4Xp", industry: "Automotive" },
  { id: "AS-07", name: "Module M-7", type: "Subassembly", org: "org:meridian", risk: "medium", riskScore: 58, parents: ["CM-18","CM-24"], children: ["PR-A"], createdAt: "Apr 10 2026", metadataUri: "shdw://mod-m7.json", metadataHash: "0x2e88…4f55", txSig: "9Kp4…r1Nm", cnft: "cNFT·2pQ3…w8Lv", industry: "Automotive" },
  { id: "AS-09", name: "Pack P-9", type: "Subassembly", org: "org:meridian", risk: "medium", riskScore: 55, parents: ["CM-31","CM-24"], children: ["PR-A"], createdAt: "Apr 10 2026", metadataUri: "shdw://pack-p9.json", metadataHash: "0x9b11…6e22", txSig: "5Lm8…t3Rx", cnft: "cNFT·7Nb5…m9Kj", industry: "Automotive" },
  { id: "PR-A", name: "EV Pack A", type: "Product", org: "org:meridian", risk: "low", riskScore: 25, parents: ["AS-07","AS-09"], children: [], createdAt: "Apr 08 2026", metadataUri: "shdw://ev-pack-a.json", metadataHash: "0x6d99…0a11", txSig: "1Xf7…b8Yz", cnft: "cNFT·8Mv2…q4Hk", industry: "Automotive" },
  { id: "PH-11", name: "Vaccine vial lot 11", type: "Product", org: "org:polaris", risk: "low", riskScore: 20, parents: ["PH-01","PH-02","PH-03"], children: [], createdAt: "Apr 05 2026", metadataUri: "shdw://vaccine-v11.json", metadataHash: "0xfe22…3b98", txSig: "6Jh2…k9Pm", cnft: "cNFT·1Qw7…n3Lx", industry: "Pharma" },
  { id: "FD-03", name: "Olive oil · cold-pressed", type: "Product", org: "org:kaldera-foods", risk: "low", riskScore: 15, parents: ["FD-01","FD-02"], children: [], createdAt: "Apr 02 2026", metadataUri: "shdw://olive-fd03.json", metadataHash: "0xaa88…1c76", txSig: "4Tr5…y2Uk", cnft: "cNFT·9Gj3…b7Sm", industry: "Food" },
];

export const ORG = {
  name: "Meridian EV",
  id: "org:meridian",
  wallet: "8Jk2…p9Qp",
  industry: "Automotive / EV",
  network: "devnet",
};

export const STATS = {
  components: 4218,
  links: 9844,
  depth: 7,
  highRisk: 12,
};

export const ACTIVITY = [32,48,28,55,42,70,65,90,72,88,110,95,82,118];
export const GROWTH = [12,28,22,38,46,52,70,88,102,118,130,142,156,168,184,210,225,240,268,282,310,332,358,382,408,422,448,472,488,512];
