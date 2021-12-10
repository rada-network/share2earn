const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses } = require('./proxyAddresses');

const contractName = "ReferralSingleContractV2";

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const proxyAddress = addresses[network];

  console.log("Deploying contracts with the account:", deployer.address);

  const contract = await ethers.getContractFactory(contractName);

  console.log('Preparing upgrade contract...');
  const v2Address = await upgrades.prepareUpgrade(proxyAddress, contract);
  console.log("New Version at:", v2Address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });