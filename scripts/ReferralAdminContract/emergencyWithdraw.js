const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: adminAddresses } = require('./proxyAddresses');
const { addresses: rirAddresses } = require('../RIRAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const adminAddress = adminAddresses[network];

  console.log("Emergency Withdraw to the account:", deployer.address);
  console.log("With ReferralAdminContract address:", adminAddress);

  const adminContract = await ethers.getContractAt("ReferralAdminContract",adminAddress);
  await adminContract.emergencyWithdrawToken(
    rirAddresses[network],
    ethers.utils.parseUnits("5", 18 )
    );

  console.log("Withdraw successfully", rirAddresses[network]);
  console.log("To", deployer.address);
  const rirToken = await ethers.getContractAt("RIRToken",rirAddresses[network]);

  const ownerBalance = await rirToken.balanceOf(deployer.address);
  console.log(ethers.utils.formatUnits(ownerBalance,18));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });