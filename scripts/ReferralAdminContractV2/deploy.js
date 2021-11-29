const { ethers, upgrades, hardhatArguments } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;

  console.log("Deploying contracts with the account:", deployer.address);

  const balance1 = await deployer.getBalance();
  console.log("Account balance:", balance1.toString());
  // console.log("With ValidUserContract address:", validUserAddress);

  const ReferralAdminContractV2 = await ethers.getContractFactory("ReferralAdminContractV2");
  const proxyContract = await upgrades.deployProxy(ReferralAdminContractV2, { kind: 'uups' });
  // const proxyContract = await ReferralAdminContractV2.deploy();

  console.log("Contract address:", proxyContract.address);
  const balance2 = await deployer.getBalance();
  console.log("Spend:", (balance1-balance2).toString());

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });