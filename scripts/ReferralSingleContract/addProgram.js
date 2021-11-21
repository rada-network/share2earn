const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./contractAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];

  const programCode = "10";
  const startTime = Math.floor(Date.now() / 1000) - 10 * 86400;
  const endTime = Math.floor(Date.now() / 1000) + 30 * 86400;

  const referralContract = await ethers.getContractAt("ReferralSingleContract",referralAddress);
  await referralContract.addProgram(programCode, startTime, endTime);

  console.log(programCode + " added");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });