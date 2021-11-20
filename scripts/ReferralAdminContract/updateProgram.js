const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: adminAddresses } = require('./proxyAddresses');
const { addresses: rirAddresses } = require('../RIRToken/tokenAddresses');
const { addresses: referralAddresses } = require('./../ReferralSingleContract/contractAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const adminAddress = adminAddresses[network];

  console.log("Change program information with the account:", deployer.address);
  console.log("With ReferralAdminContract address:", adminAddress);

  const programCode = "8";

  const adminContract = await ethers.getContractAt("ReferralAdminContract",adminAddress);
  await adminContract.updateProgram(
    programCode,
    rirAddresses[network],
    referralAddresses,
    ethers.utils.parseUnits("0.02", 18 ),
    ethers.utils.parseUnits("0.01", 18 ),
    ethers.utils.parseUnits("0.001", 18 ),
    ethers.utils.parseUnits("10", 18 )
    );

  console.log("Changed", program);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });