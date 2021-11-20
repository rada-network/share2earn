const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: adminAddresses } = require('./proxyAddresses');
const { addresses: meoAddresses } = require('../MEOToken/tokenAddresses');
const { addresses: rirAddresses } = require('../RIRToken/tokenAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const adminAddress = adminAddresses[network];

  console.log("Top-up contracts with the account:", deployer.address);
  console.log("With ReferralAdminContract address:", adminAddress);

  // Sample top-up Tokens to contract
  const rirToken = await ethers.getContractAt("RIRToken",rirAddresses[network]);
  await rirToken.transfer(adminAddress, ethers.utils.parseUnits( "100" , 18 ));
  console.log("Top-up 100 RIR");

  const meoToken = await ethers.getContractAt("MEOToken",meoAddresses[network]);
  await meoToken.transfer(adminAddress, ethers.utils.parseUnits( "100" , 18 ));
  console.log("Top-up 100 MEO");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });