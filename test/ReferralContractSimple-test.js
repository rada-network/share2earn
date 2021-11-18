// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Referral Simple contract", function () {

  let ReferralContractSimple;
  let RIRToken;
  let rirToken;
  let contract;

  beforeEach(async function () {

    // Get the ContractFactory and Signers here.
    RIRToken = await ethers.getContractFactory("RIRToken");
    ReferralContractSimple = await ethers.getContractFactory("ReferralContractSimpleSimple");

    [owner, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners();

    rirToken = await RIRToken.deploy();
    meoToken = await MEOToken.deploy();

    contract = await ReferralContractSimple.deploy();
    await rirToken.transfer(contract.address, ethers.utils.parseUnits( "100" , 18 ));
    await meoToken.transfer(contract.address, ethers.utils.parseUnits( "100" , 18 ));

  });

  it('Deploy v1 and should set right owner', async function () {
    expect(await contract.admin()).to.equal(owner.address);
  });

  it('Should RIRToken have balance 100 token', async function () {
    const contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits( "100" , 18 ));
  });

  it('Should add new program', async function () {

    await contract.addProgram("RIRProgram", rirToken.address);

    await expect(await contract.programs("RIRProgram")).to.equal(rirToken.address);
  });

  it('Should add 1 programs and let user join ', async function () {

    await contract.addProgram("RIRProgram", rirToken.address);

    await expect(await contract.programs("RIRProgram")).to.equal(rirToken.address);

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";

    await expect(contract.connect(addr1).joinProgram("RIRProgram", uid1, "")).to.not.be.reverted;
    await expect(contract.connect(addr2).joinProgram("RIRProgram", uid2,"")).to.not.be.reverted;

  });

  it('Should let a user cannot join new program with this user\s uid', async function () {

    const uid = "123123";

    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);

    await expect(contract.connect(addr4).joinProgram("RIRProgram", uid, "")).to.be.reverted;

  });

  it('Should let a user join new program with referral code and check duplicate', async function () {

    // Set user 1
    const uid1 = "123123";
    // Set user 2
    const uid2 = "456456";
    // This uid not valid
    const uid4 = "789789";


    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);
    // Join with uid1 (no referral code)
    await contract.connect(addr1).joinProgram("RIRProgram", uid1, "");
    // Join with uid2 (with uid1)
    await contract.connect(addr2).joinProgram("RIRProgram", uid2 , uid1);

    // Join with uid4 (with uid1)
    await expect(contract.connect(addr4).joinProgram("RIRProgram", uid1)).to.be.reverted;

    // Try join again with same address and uid1
    await expect(contract.connect(addr2).joinProgram("RIRProgram", uid1)).to.be.reverted;


    await expect(await contract.uidJoined("RIRProgram",uid1)).to.equal(true);
    await expect(await contract.uidJoined("RIRProgram",uid2)).to.equal(true);
    await expect(await contract.uidJoined("RIRProgram",uid4)).to.equal(false);

  });

  it('Should join program successfully with referral code and got incentive | 1 level', async function () {

    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram("RIRProgram", "");
    const referralCode = await contract.getUserUid(addr1.address);

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram("RIRProgram", referralCode);
    const uid2 = await contract.getUserUid(addr2.address);
    // User C join program with referral code of user A
    await contract.connect(addr3).joinProgram("RIRProgram", referralCode);
    const uid3 = await contract.getUserUid(addr3.address);

    // Refer successfully
    expect(await contract.uidJoined("RIRProgram",referralCode)).to.equal(true);
    expect(await contract.uidJoined("RIRProgram",uid2)).to.equal(true);
    expect(await contract.uidJoined("RIRProgram",uid3)).to.equal(true);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.04" , 18 )); // 0.04 RIR

  });

  it('Should join program successfully with referral code and got incentive | 2 level', async function () {

    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram("RIRProgram","");
    const referralCode = await contract.getUserUid(addr1.address);

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram("RIRProgram", referralCode);
    const referralCodeUserB = await contract.getUserUid(addr2.address);

    // User C join program with referral code of user B
    await contract.connect(addr3).joinProgram("RIRProgram",referralCodeUserB);

    // Refer successfully
    expect(await contract.rUserFromUser("RIRProgram",addr2.address)).to.equal(addr1.address);
    // expect(await contract.rUserFromUser("RIRProgram",addr3.address)).to.equal(addr2.address);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.03" , 18 )); // 0.03 RIR
    // Check balance incentive of user B
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.02" , 18 )); // 0.02 RIR

  });

  it('Should join program successfully with referral code and got incentive | 3 level', async function () {
    // Add program
    await contract.addProgram("RIRProgram", rirToken.address);

    // Set user
    const uid4 = "666666";
    await validUserContract.setUser(addr4.address,uid4);
    const uid5 = "777777";
    await validUserContract.setUser(addr5.address,uid5);

    // User A join program and got referral code
    await contract.connect(addr1).joinProgram("RIRProgram","");
    const referralCode = await contract.getUserUid(addr1.address);

    // User B join program with referral code of user A
    await contract.connect(addr2).joinProgram("RIRProgram",referralCode);
    const referralCodeUserB = await contract.getUserUid(addr2.address);
    // User A got 0.02
    // User B got 0

    // User C join program with referral code of user B
    await contract.connect(addr3).joinProgram("RIRProgram",referralCodeUserB);
    const referralCodeUserC = await contract.getUserUid(addr3.address);
    // User A got 0.01 => 0.03
    // User B got 0.02

    // User D join program with referral code of user C
    await contract.connect(addr4).joinProgram("RIRProgram", referralCodeUserC);
    // User E join program with referral code of user C
    await contract.connect(addr5).joinProgram("RIRProgram", referralCodeUserC);
    // User A got 0.002 => 0.032
    // User B got 0.02 => 0.04

    // Refer successfully
    expect(await contract.rUserFromUser("RIRProgram",addr2.address)).to.equal(addr1.address);
    expect(await contract.rUserFromUser("RIRProgram",addr3.address)).to.equal(addr2.address);

    // Check balance incentive of user A
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.032" , 18 )); // 0.032 RIR
    // Check balance incentive of user B
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.04" , 18 )); // 0.04 RIR

  });


  it('Should transfer back token from Referral Contract', async function () {

    await contract.emergencyWithdrawToken(rirToken.address, ethers.utils.parseUnits( "50" , 18 ));

    const contractBalance = await rirToken.balanceOf(contract.address);
    expect(contractBalance).to.equal(ethers.utils.parseUnits( "50" , 18 ));
  });

});