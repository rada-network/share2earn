const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: adminAddresses } = require('./proxyAddresses');

async function main() {
  const [deployer] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const adminAddress = adminAddresses[network];

  console.log("Set Admin with the account: ", deployer.address);
  console.log("With ReferralAdminContractV2 address: ", adminAddress);

  const adminContract = await ethers.getContractAt("ReferralAdminContractV2",adminAddress);

  await adminContract.setAdmin("0xAE51701F3eB7b897eB6EE5ecdf35c4fEE29BFAe6",true); // Chrome Quang
  // await adminContract.setAdmin("0x445AEEd98b560697F3846AD8c757b6C62d2652ec",true); // Tung Nguyen
  // await adminContract.setAdmin("0xdcbEEb4a9a8C1778f6700c90608d8d57a0217976",true); // Anh Khanh
  // await adminContract.setAdmin("0x1f6A21AF5a882527af291227d0E6E72c372E5290",true); // Lữ

  console.log("Finished set Admins");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });