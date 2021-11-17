const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];

  console.log("Set Admin with the account: ", deployer.address);
  console.log("With ReferralContract address: ", referralAddress);

  const program = "PGX";
  console.log("Program: ", program);
  // const address = "0x329A3600DDAa362C9239d51A2bA171e1BAbe5369"; // Firefox
  const address = "0xB2c8321fc63809DE7CfcBdaaCeF8aa798420D425"; // Brave
  

  const referralContract = await ethers.getContractAt("ReferralContract",referralAddress);
  await referralContract.setAdmin(address,true);
  console.log("Finished set Admin for: ", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });