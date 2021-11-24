// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Referral Single contract", function () {

  let ReferralSingleContract;
  let contract;
  let programCode;

  beforeEach(async function () {

    // Get the ContractFactory and Signers here.
    ReferralSingleContract = await ethers.getContractFactory("ReferralSingleContract");

    [owner, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners();

    const startTime = Math.floor(Date.now() / 1000) - 1 * 86400;
    const endTime = Math.floor(Date.now() / 1000) + 15 * 86400;
    // const tokenAllocation = ethers.utils.parseUnits( "10" , 18 );
    // const incentiveRate = ethers.utils.parseUnits( "0.02" , 18 );

    // contract = await ReferralSingleContract.deploy();
    contract = await upgrades.deployProxy(ReferralSingleContract, { kind: 'uups' });


    // Set addr4 is Admin
    await contract.setAdmin(addr4.address, true);

    // Add default program
    programCode =  "PGX";
    await contract.addProgram(programCode, startTime, endTime);
    // Test Update program
    await contract.updateProgram(programCode, startTime, endTime);

  });

  it('Deploy v1 and should set right owner', async function () {
    expect(await contract.admins(owner.address)).to.equal(true);
  });

  it('Should let user join', async function () {
    const program = await contract.programs(programCode);
    await expect(program.code).to.equal(programCode);

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";

    await expect(contract.connect(addr1).joinProgram(programCode, uid1, "")).to.not.be.reverted;
    await expect(contract.connect(addr2).joinProgram(programCode, uid2, "")).to.not.be.reverted;

  });

  it('Should let a user cannot join new program with this user\s uid', async function () {

    const uid = "123123";

    await contract.connect(addr1).joinProgram(programCode, uid, "");

    await expect(contract.connect(addr4).joinProgram(programCode, uid, "")).to.be.reverted;

  });

  it('Should update program information', async function () {

    const startTime = Math.floor(Date.now() / 1000) - 10000;
    const endTime = Math.floor(Date.now() / 1000) + 10 * 86400;
    // const tokenAllocation = ethers.utils.parseUnits( "5" , 18 );
    // const incentiveRate = ethers.utils.parseUnits( "0.02" , 18 );


    await contract.updateProgram(programCode, startTime, endTime);
    const program = await contract.programs(programCode);

    await expect(await program.endTime).to.equal(endTime);

    // Admin update
    await expect(contract.connect(addr4).updateProgram(programCode, startTime, endTime)).to.not.be.reverted;
    // Other update
    await expect(contract.connect(addr2).updateProgram(programCode, startTime, endTime)).to.be.reverted;

  });

  it('Should let a user join program with referral code and check duplicate', async function () {

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // This uid not valid
    const uid4 = "789789";


    // Join with uid1 (no referral code)
    await contract.connect(addr1).joinProgram(programCode, uid1, "");
    // Join with uid2 (with uid1)
    await contract.connect(addr2).joinProgram(programCode, uid2 , uid1);

    // Join with uid4 (with uid1)
    await expect(contract.connect(addr4).joinProgram(programCode, uid1, uid4)).to.be.reverted;

    await contract.connect(addr4).joinProgram(programCode, uid4 , uid1);

    // Try join again with same address and uid1
    await expect(contract.connect(addr2).joinProgram(programCode, uid2 , uid1)).to.be.reverted;


    await expect(await contract.uidJoined(programCode, uid1)).not.to.equal("0x0000000000000000000000000000000000000000");
    await expect(await contract.uidJoined(programCode, uid2)).not.to.equal("0x0000000000000000000000000000000000000000");
    await expect(await contract.uidJoined(programCode, uid4)).not.to.equal("0x0000000000000000000000000000000000000000");

    // console.log(await contract.getJoiners())
    // console.log(await contract.getJoinerReferees(uid1))

  });


  it('Trying cheating.....', async function () {
    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // Set user 3
    const uid3 = "009900";
    // Set user 4
    const uid4 = "789789";

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram(programCode, uid1, "");

    // User A want cheating, join itself again
    await expect(contract.connect(addr1).joinProgram(programCode, uid1, uid1)).to.be.reverted;
    // User B join
    await expect(contract.connect(addr2).joinProgram(programCode, uid2, uid1)).to.not.be.reverted;
    // User B want cheating, create difference uid
    await expect(contract.connect(addr2).joinProgram(programCode, uid3, uid1)).to.be.reverted;
  });


  it('Should let user join level 1, level 2 and count', async function () {

    const uid1 = "123123";
    const uid2 = "456456";
    const uid3 = "aad32d";
    const uid4 = "hr2h65";

    await contract.connect(addr1).joinProgram(programCode, uid1, "");
    await contract.connect(addr2).joinProgram(programCode, uid2, uid1);
    await contract.connect(addr3).joinProgram(programCode, uid3, uid2);
    await contract.connect(addr4).joinProgram(programCode, uid4, uid2);
    // const referess1 = await contract.getJoinerRefereesL1Address(programCode, addr1.address);
    await expect(await contract.getTotalRefereesL1(programCode, addr1.address)).to.equal(1);
    await expect(await contract.getTotalRefereesL2(programCode, addr1.address)).to.equal(2);

    const total = await contract.getTotalRefereesL1L2(programCode, addr1.address);
    await expect(total[0]).to.equal(ethers.utils.parseUnits( "1" , 0 ));
    await expect(total[1]).to.equal(ethers.utils.parseUnits( "2" , 0 ));
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

    await expect(contract.connect(addr4).joinProgram(programCode, uid1, "")).to.be.reverted;
  });

});
