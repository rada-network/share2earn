const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./contractAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];

  console.log("Set Admin with the account: ", deployer.address);
  console.log("With ReferralSingleContract address: ", referralAddress);

  const referralContract = await ethers.getContractAt("ReferralSingleContract",referralAddress);

  await referralContract.setAdmin("0xAE51701F3eB7b897eB6EE5ecdf35c4fEE29BFAe6",true); // Chrome
  await referralContract.setAdmin("0x329A3600DDAa362C9239d51A2bA171e1BAbe5369",true); // Firefox
  await referralContract.setAdmin("0xB2c8321fc63809DE7CfcBdaaCeF8aa798420D425",true); // Brave
  await referralContract.setAdmin("0xB5e68dC8BF76Da1b28baaA8Fe271AF24524d4AE8",true); // Brave 2
  await referralContract.setAdmin("0xeb52e06ed8dfb6007771A5194790773Ba4066BF3",true); // Tung Nguyen

  console.log("Finished set Admins");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });