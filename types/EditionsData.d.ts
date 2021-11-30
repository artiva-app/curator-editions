import { BigNumberish, BytesLike } from "ethers";

export interface EditionsData {
  name: string;
  symbol: string;
  description: string;
  animationUrl: string;
  animationHash: BytesLike;
  imageUrl: string;
  imageHash: BytesLike;
  editionSize: BigNumberish;
  price: BigNumberish;
  royaltyBPS: BigNumberish;
  owner: string;
}
