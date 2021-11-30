import { BigNumberish } from "ethers";

export type SplitData = {
  title: string;
  payees: string[];
  shares: BigNumberish[];
};
