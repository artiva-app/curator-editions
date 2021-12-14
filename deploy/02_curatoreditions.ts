import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const paymentSplitterFactoryAddress = (
    await deployments.get("PaymentSplitterFactory")
  ).address;

  const { deployer, singleEditionMintableCreator } = await getNamedAccounts();

  await deploy("CuratorEditions", {
    from: deployer,
    args: [singleEditionMintableCreator, paymentSplitterFactoryAddress],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};
export default func;
func.tags = ["CuratorEditions"];
func.dependencies = ["PaymentSplitterFactory"];
