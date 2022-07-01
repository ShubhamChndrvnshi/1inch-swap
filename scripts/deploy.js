// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {

  // deploying address registry
  console.log("\nDeploying Swap Proxy");
  console.log("Procuring artifacts");
  const SwapProxy = await hre.ethers.getContractFactory("SwapProxy");
  console.log("Sending transaction");
  const swapProxy = await SwapProxy.deploy("0x11111112542D85B3EF69AE05771c2dCCff4fAa26");
  console.log("Transaction sent");
  console.log("Waiting for deployment");
  await swapProxy.deployed();
  console.log("Waiting for block confirmation");
  let reciept = await swapProxy.deployTransaction.wait();
  console.log("Transaction confirmed: "+reciept.transactionHash);
  console.log({
    swapProxyAddress: swapProxy.address
  })
  return {
    swapProxyAddress: swapProxy.address
  }

}
exports.deploy = main;
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

