const crypto = require('crypto')
const { ethers, upgrades, hardhatArguments } = require('hardhat');
const { addresses: referralAddresses } = require('./proxyAddresses');
const { addresses: meoAddresses } = require('../MEOToken/tokenAddresses');
const { addresses: rirAddresses } = require('../RIRToken/tokenAddresses');

async function main() {
  [owner, ...addrs] = await ethers.getSigners();

  const network = hardhatArguments.network;
  const referralAddress = referralAddresses[network];
  const referralContract = await ethers.getContractAt("ReferralContract",referralAddress);

  const codeProgram = "PGX";
  const startFrom = 0;
  const uid = crypto.createHash('md5').update(addrs[startFrom].address).digest('hex').substring(0,12);
  console.log(uid)
  await referralContract.connect(addrs[startFrom]).joinProgram(codeProgram, uid, "");

  /*for (let i=(startFrom+1);i<(startFrom+3);i++) {
    const addr = addrs[i];
    const uidJoiner = crypto.createHash('md5').update(addr.address).digest('hex').substring(0,12);

    await referralContract.connect(addr).joinProgram(codeProgram, uidJoiner, uid);
    console.log(uidJoiner)
  } */

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });