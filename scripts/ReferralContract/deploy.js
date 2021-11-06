const { ethers, upgrades, hardhatArguments } = require('hardhat');
// const { addresses: validAddresses } = require('../ValidUserContract/proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  // const validUserAddress = validAddresses[network];


  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());
  // console.log("With ValidUserContract address:", validUserAddress);


  const ReferralContract = await ethers.getContractFactory("ReferralContract");
  // const proxyContract = await upgrades.deployProxy(ReferralContract, [validUserAddress], { kind: 'uups' });
  const proxyContract = await upgrades.deployProxy(ReferralContract, { kind: 'uups' });

  console.log("Contract address:", proxyContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });