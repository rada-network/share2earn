const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: adminAddresses } = require('./proxyAddresses');
const { addresses: rirAddresses } = require('../RIRToken/tokenAddresses');
const { addresses: referralAddresses } = require('./../ReferralSingleContract/contractAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const adminAddress = adminAddresses[network];
  const referralAddress = referralAddresses[network];

  const programCode = "8";

  const adminContract = await ethers.getContractAt("ReferralAdminContract",adminAddress);
  await adminContract.addProgram(programCode, rirAddresses[network], referralAddress);

  console.log(programCode + " added");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });