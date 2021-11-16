const { ethers, upgrades, hardhatArguments } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const ValidUserContract = await ethers.getContractFactory("ValidUserContract");
  const proxyContract = await upgrades.deployProxy(ValidUserContract,{ kind: 'uups' });


  console.log("ValidUserContract address:", proxyContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });