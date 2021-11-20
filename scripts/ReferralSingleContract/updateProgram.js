const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./contractAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];

  console.log("Change program information with the account:", deployer.address);
  console.log("With ReferralSingleContract address:", referralAddress);

  const program = "8";
  const startTime = Math.floor(Date.now() / 1000);
  const endTime = Math.floor(Date.now() / 1000) + 10 * 86400;

  const referralContract = await ethers.getContractAt("ReferralSingleContract",referralAddress);
  await referralContract.updateProgram(
    program, startTime, endTime
    );
  console.log("Changed", program);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });