const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: adminAddresses } = require('./proxyAddresses');
const { addresses: rirAddresses } = require('../RIRAddresses');
const { addresses: referralAddresses } = require('../ReferralSingleContract/proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const adminAddress = adminAddresses[network];
  const referralAddress = referralAddresses[network];

  const programCode = "19";

  const adminContract = await ethers.getContractAt("ReferralAdminContractV2",adminAddress);
  await adminContract.addProgram(programCode, rirAddresses[network], referralAddress);

  await adminContract.updateProgram(
    programCode,
    rirAddresses[network],
    referralAddress,
    ethers.utils.parseUnits("0.01", 18 ),
    ethers.utils.parseUnits("0.001", 18 ),
    ethers.utils.parseUnits("0", 18 ),
    ethers.utils.parseUnits("1", 18 ),
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