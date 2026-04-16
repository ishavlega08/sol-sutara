import { PublicKey } from "@solana/web3.js";

export interface Component {
  id: string;
  metadataHash: string;
  parents: PublicKey[];
  createdAt?: number;
}

export interface LinkComponentsArgs {
  parentPubkey: PublicKey;
  childPubkey: PublicKey;
}
