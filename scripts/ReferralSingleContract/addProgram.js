const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];

  const programCode = "19";
  const startTime = 1637600340; // Monday, November 22, 2021 11:59:00 PM GMT+07:00
  // Math.floor(Date.now() / 1000);
  const endTime = 1643504461 //   Sunday, January 30, 2022 1:01:01 AM;

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