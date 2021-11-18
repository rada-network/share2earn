// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Referral Simple contract", function () {

  let ReferralContractSingle;
  let contract;
  let programCode;

  beforeEach(async function () {

    // Get the ContractFactory and Signers here.
    ReferralContractSingle = await ethers.getContractFactory("ReferralContractSingle");

    [owner, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners();

    programCode = "PGX";

    // const startTime = Math.floor(Date.now() / 1000) - 10000;
    const endTime = Math.floor(Date.now() / 1000) + 10 * 86400;
    const tokenAllocation = ethers.utils.parseUnits( "10" , 18 );
    const incentiveRate = ethers.utils.parseUnits( "0.02" , 18 );

    contract = await ReferralContractSingle.deploy(programCode, tokenAllocation, incentiveRate, endTime);
  });

  it('Deploy v1 and should set right owner', async function () {
    expect(await contract.admin()).to.equal(owner.address);
  });

  it('Should let user join ', async function () {

    await expect(await contract.programCode()).to.equal(programCode);

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";

    await expect(contract.connect(addr1).joinProgram(uid1, "")).to.not.be.reverted;
    await expect(contract.connect(addr2).joinProgram(uid2, "")).to.not.be.reverted;

  });

  it('Should let a user cannot join new program with this user\s uid', async function () {

    const uid = "123123";

    await contract.connect(addr1).joinProgram(uid, "");

    await expect(contract.connect(addr4).joinProgram(uid, "")).to.be.reverted;

  });

  it('Should update program information', async function () {

    const endTime = Math.floor(Date.now() / 1000) + 10 * 86400;
    const tokenAllocation = ethers.utils.parseUnits( "5" , 18 );
    const incentiveRate = ethers.utils.parseUnits( "0.02" , 18 );

    await contract.setProgram(programCode, tokenAllocation, incentiveRate, endTime);

    await expect(await contract.tokenAllocation()).to.equal(ethers.utils.parseUnits( "5" , 18 ));

    await expect(contract.connect(addr4).setProgram(programCode, tokenAllocation, incentiveRate, endTime)).to.be.reverted;

  });

  it('Should let a user join program with referral code and check duplicate', async function () {

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // This uid not valid
    const uid4 = "789789";


    // Join with uid1 (no referral code)
    await contract.connect(addr1).joinProgram(uid1, "");
    // Join with uid2 (with uid1)
    await contract.connect(addr2).joinProgram(uid2 , uid1);

    // Join with uid4 (with uid1)
    await expect(contract.connect(addr4).joinProgram(uid1, uid4)).to.be.reverted;

    await contract.connect(addr4).joinProgram(uid4 , uid1);

    // Try join again with same address and uid1
    await expect(contract.connect(addr2).joinProgram(uid2 , uid1)).to.be.reverted;


    await expect(await contract.uidJoined(uid1)).not.to.equal("0x0000000000000000000000000000000000000000");
    await expect(await contract.uidJoined(uid2)).not.to.equal("0x0000000000000000000000000000000000000000");
    await expect(await contract.uidJoined(uid4)).not.to.equal("0x0000000000000000000000000000000000000000");

    // console.log(await contract.getJoiners())
    // console.log(await contract.getJoinerReferees(uid1))

  });

  // Require start at last time
  it('Should don\'t let user join expired program', async function () {

    // Set user 1
    const uid1 = "123123";

    const START_TIME = Math.floor(Date.now() / 1000);
    const increaseDays = 30;
    const increaseTime = parseInt(START_TIME) - Math.floor(Date.now() / 1000) + 86400*(increaseDays-1);

    await ethers.provider.send("evm_increaseTime", [increaseTime]);
    await ethers.provider.send("evm_mine", []) // force mine the next block

    await expect(contract.connect(addr4).joinProgram(uid1, "")).to.be.reverted;
  });


});
