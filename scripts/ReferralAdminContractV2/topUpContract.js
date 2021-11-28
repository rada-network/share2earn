const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: adminAddresses } = require('./proxyAddresses');
const { addresses: rirAddresses } = require('../RIRAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const adminAddress = adminAddresses[network];

  console.log("Top-up contracts with the account:", deployer.address);
  console.log("With ReferralAdminContractV2 address:", adminAddress);

  // Sample top-up Tokens to contract
  const rirToken = await ethers.getContractAt("RIRToken",rirAddresses[network]);
  await rirToken.transfer(adminAddress, ethers.utils.parseUnits( "10" , 18 ));
  console.log("Top-up 10 RIR");

  const ownerBalance = await rirToken.balanceOf(deployer.address);
  console.log(ethers.utils.formatUnits(ownerBalance,18));

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });