const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./proxyAddresses');
const { addresses: meoAddresses } = require('../MEOToken/tokenAddresses');
const { addresses: rirAddresses } = require('../RIRToken/tokenAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];

  const referralContract = await ethers.getContractAt("ReferralContract",referralAddress);
  await referralContract.addProgram("8",rirAddresses[network]);
  console.log("8 added");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });