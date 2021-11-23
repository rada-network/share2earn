const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: adminAddresses } = require('./proxyAddresses');
const { addresses: rirAddresses } = require('../RIRAddresses');
const { addresses: referralAddresses } = require('../ReferralSingleContract/proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const adminAddress = adminAddresses[network];
  const referralAddress = referralAddresses[network];

  const programCode = "10";

  const adminContract = await ethers.getContractAt("ReferralAdminContract",adminAddress);
  await adminContract.addProgram(programCode, rirAddresses[network], referralAddress);

  await adminContract.updateProgram(
    programCode,
    rirAddresses[network],
    referralAddress,
    ethers.utils.parseUnits("0.1", 18 ),
    ethers.utils.parseUnits("0.01", 18 ),
    ethers.utils.parseUnits("0.001", 18 ),
    ethers.utils.parseUnits("2", 18 ),
    ethers.utils.parseUnits("200", 18 )
    );

  console.log(programCode + " added");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });