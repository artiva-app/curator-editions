import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  CuratorEditions,
  PaymentSplitter,
  SingleEditionMintable,
} from "../typechain";
import { EditionsData } from "../types/EditionsData";
import { SplitData } from "../types/SplitData";

const editionData: EditionsData = {
  name: "Testing Token",
  symbol: "TEST",
  description: "This is a testing token for all",
  animationUrl:
    "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
  animationHash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  imageUrl: "",
  imageHash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  editionSize: 10,
  royaltyBPS: 10,
  price: ethers.utils.parseEther("0.2"),
};

describe("Curator Editions", function () {
  let signer: SignerWithAddress;
  let signerAddress: string;
  let curatorEditions: CuratorEditions;
  let splitData: SplitData;

  before(async function () {
    this.CuratorEditions = await ethers.getContractFactory("CuratorEditions");
    this.PaymentSplitterFactory = await ethers.getContractFactory(
      "PaymentSplitterFactory"
    );
    this.SharedNFTLogic = await ethers.getContractFactory("SharedNFTLogic");
    this.SingleEditionMintableCreator = await ethers.getContractFactory(
      "SingleEditionMintableCreator"
    );
    this.SingleEditionMintable = await ethers.getContractFactory(
      "SingleEditionMintable"
    );
  });

  beforeEach(async function () {
    const sharedNFTLogic = await this.SharedNFTLogic.deploy();
    await sharedNFTLogic.deployed();

    const singleEditionMintable = await this.SingleEditionMintable.deploy(
      sharedNFTLogic.address
    );
    await singleEditionMintable.deployed();

    const singleEditionMintableCreator =
      await this.SingleEditionMintableCreator.deploy(
        singleEditionMintable.address
      );
    await singleEditionMintableCreator.deployed();

    const paymentSplitterFactory = await this.PaymentSplitterFactory.deploy();
    await paymentSplitterFactory.deployed();

    curatorEditions = await this.CuratorEditions.deploy(
      singleEditionMintableCreator.address,
      paymentSplitterFactory.address
    );
    await curatorEditions.deployed();

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    const s2 = (await ethers.getSigners())[1];
    const s2A = await s2.getAddress();

    splitData = {
      title: "Test",
      shares: [50, 50],
      payees: [signerAddress, s2A],
    };
  });

  it("Creates Editions", async function () {
    const tx = await curatorEditions.createCuratorEdition(
      editionData,
      splitData
    );
    await tx.wait();

    const editionAddress = await curatorEditions.getEditionAddress("0");
    const minterContract = (await ethers.getContractAt(
      "SingleEditionMintable",
      editionAddress
    )) as SingleEditionMintable;
    expect(await minterContract.name()).to.be.equal("Testing Token");
    expect(await minterContract.symbol()).to.be.equal("TEST");
    const editionUris = await minterContract.getURIs();
    expect(editionUris[0]).to.be.equal("");
    expect(editionUris[1]).to.be.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(editionUris[2]).to.be.equal(
      "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy"
    );
    expect(editionUris[3]).to.be.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(await minterContract.editionSize()).to.be.equal(10);
    expect(await minterContract.owner()).to.be.equal(signerAddress);

    const splitterAddress = await curatorEditions.editionIdToSplitter("0");
    const splitterContract = (await ethers.getContractAt(
      "PaymentSplitter",
      splitterAddress
    )) as PaymentSplitter;
    expect(await splitterContract.title()).to.be.equal("Test");
  });

  describe("with an edition", async function () {
    beforeEach(async () => {
      const tx = await curatorEditions.createCuratorEdition(
        editionData,
        splitData
      );
      await tx.wait();
    });

    it("purchases new editions", async () => {
      expect(
        await curatorEditions.purchase("0", {
          value: ethers.utils.parseEther("0.2"),
        })
      ).to.emit(curatorEditions, "EditionSold");
    });

    it("splits payments", async () => {
      await curatorEditions.purchase("0", {
        value: ethers.utils.parseEther("0.2"),
      });

      const signerBalance = await signer.getBalance();
      await curatorEditions.withdraw("0");
      expect(
        (await signer.getBalance())
          .sub(signerBalance)
          .gte(ethers.utils.parseEther("0.09"))
      ).equals(true);
    });

    it("sets price", async () => {
      await curatorEditions.setSalePrice("0", ethers.utils.parseEther("0.4"));
      await expect(
        curatorEditions.purchase("0", {
          value: ethers.utils.parseEther("0.2"),
        })
      ).to.be.revertedWith("INVALID_PRICE");

      await curatorEditions.purchase("0", {
        value: ethers.utils.parseEther("0.4"),
      });
      const signerBalance = await signer.getBalance();
      await curatorEditions.withdraw("0");
      expect(
        (await signer.getBalance())
          .sub(signerBalance)
          .gte(ethers.utils.parseEther("0.19"))
      ).to.equal(true);
    });
  });
});
