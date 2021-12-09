// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Referral Admin Contract Version 3", function () {

  let contractAdmin;
  let programCode;

  let rirToken;
  let meoToken;

  // Set user 1
  const uid1 = "123123";
  const uid2 = "456456";
  const uid3 = "789789";
  const uid4 = "7893aa";
  const uid5 = "vvf3aa";
  const uid6 = "hhr3aa";

  beforeEach(async function () {

    [owner, addr1, addr2, addr3, addr4, addr5, addr6, ...addrs] = await ethers.getSigners();

    // Get the ContractFactory and Signers here.
    const RIRToken = await ethers.getContractFactory("RIRToken");
    const MEOToken = await ethers.getContractFactory("MEOToken");
    const ReferralAdminContractV2 = await ethers.getContractFactory("ReferralAdminContractV2");
    const ReferralSingleContract = await ethers.getContractFactory("ReferralSingleContract");

    rirToken = await RIRToken.deploy();
    meoToken = await MEOToken.deploy();

    // Add default program
    programCode =  "PGX";
    const startTime = Math.floor(Date.now() / 1000) - 10000;
    const endTime = Math.floor(Date.now() / 1000) + 10 * 86400;
    // const tokenAllocation = ethers.utils.parseUnits( "10" , 18 );
    // const incentiveRate = ethers.utils.parseUnits( "0.02" , 18 );

    // Add program to Referral Contract
    contractSingle = await upgrades.deployProxy(ReferralSingleContract, { kind: 'uups' });

    // contractSingle = await ReferralSingleContract.deploy();
    // Set addr4 is Admin
    await contractSingle.setAdmin(addr4.address, true);
    await contractSingle.addProgram(programCode, startTime, endTime);


    // contractAdmin = await ReferralAdminContractV2.deploy();
    contractAdmin = await upgrades.deployProxy(ReferralAdminContractV2, { kind: 'uups' });

    // Upgrade V3
    const ReferralAdminContractV3 = await ethers.getContractFactory("ReferralAdminContractV3");
    contractAdmin = await upgrades.upgradeProxy(contractAdmin.address, ReferralAdminContractV3);

    await rirToken.transfer(contractAdmin.address, ethers.utils.parseUnits( "10" , 18 ));
    await meoToken.transfer(contractAdmin.address, ethers.utils.parseUnits( "10" , 18 ));

    // Set addr4 is Admin
    await contractAdmin.setAdmin(addr4.address, true);

    // Add default program
    await contractAdmin.addProgram(programCode, rirToken.address, contractSingle.address);

    await contractAdmin.updateProgram(programCode,
      rirToken.address,
      contractSingle.address,
      ethers.utils.parseUnits( "0.02" , 18),
      ethers.utils.parseUnits( "0.002" , 18),
      ethers.utils.parseUnits( "0.000" , 18),
      ethers.utils.parseUnits( "2" , 18),
      ethers.utils.parseUnits( "10" , 18));

    await contractSingle.connect(addr1).joinProgram(programCode, uid1, "");
    await contractSingle.connect(addr2).joinProgram(programCode, uid2 , uid1);
    await contractSingle.connect(addr3).joinProgram(programCode, uid3 , uid1);
    await contractSingle.connect(addr4).joinProgram(programCode, uid4 , uid2);

  });

  it('Deploy v1 and should set right owner', async function () {
    expect(await contractAdmin.admins(addr4.address)).to.equal(true);
  });

  /* it('Should get information of program', async function () {
    const program = await contractSingle.getProgram(programCode);
    console.log(program)
  }); */


  it('Should approve right incentive', async function () {

    // Approve
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[2,1],[1,0]);
    expect(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address)).to.equal(ethers.utils.parseUnits( "0.042" , 18 ));


    // Approve more 50 L1
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address],[52],[1]);

    // Claim token
    await contractAdmin.connect(addr1).claim(programCode);

    expect(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address)).to.equal(ethers.utils.parseUnits( "0.042" , 18 ));
    expect(await contractAdmin.connect(addr2).claimableApproved(rirToken.address,addr2.address)).to.equal(ethers.utils.parseUnits( "0.02" , 18 ));

    await expect(contractAdmin.connect(addr1).claim(programCode)).to.be.reverted;
    await expect(contractAdmin.connect(addr2).claim(programCode)).to.be.reverted;


    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "1" , 18 ));
    expect(await rirToken.balanceOf(addr2.address)).to.equal(0);

    expect(await contractAdmin.claimedCount(rirToken.address)).to.equal(1);
    expect(await contractAdmin.claimedAmount(rirToken.address)).to.equal(ethers.utils.parseUnits( "1" , 18 ));
    expect(await contractAdmin.claimableAmount(rirToken.address)).to.equal(ethers.utils.parseUnits( "0.062" , 18 ));

    const program = await contractAdmin.programs(programCode);
    expect(program.tokenAmountIncentive).to.equal(ethers.utils.parseUnits( "1.062" , 18 ));

  });

  it('Should approve right incentive special case', async function () {

    // Approve
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address],[50],[50]);

    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address),18));
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).incentivePaid(programCode,addr1.address),18));

    // expect(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address)).to.equal(ethers.utils.parseUnits( "1.1" , 18 ));

    // Claim token
    await contractAdmin.connect(addr1).claim(programCode);
    console.log('Claimed');
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address),18));
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).incentivePaid(programCode,addr1.address),18));

    // expect(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address)).to.equal(ethers.utils.parseUnits( "0.1" , 18 ));
    await expect(contractAdmin.connect(addr1).claim(programCode)).to.be.reverted;

    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "1" , 18 ));

    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address],[100],[50]);
    console.log('Approved again');
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address),18));
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).incentivePaid(programCode,addr1.address),18));

    await contractAdmin.connect(addr1).claim(programCode);
    console.log('Claimed again');
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address),18));
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).incentivePaid(programCode,addr1.address),18));

    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address],[200],[50]);
    console.log('Approved again');
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address),18));
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).incentivePaid(programCode,addr1.address),18));

    await expect(contractAdmin.connect(addr1).claim(programCode)).to.be.reverted;
    console.log('Claimed again');
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address),18));
    console.log(ethers.utils.formatUnits(await contractAdmin.connect(addr1).incentivePaid(programCode,addr1.address),18));


    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "2" , 18 ));

    // expect(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address)).to.equal(ethers.utils.parseUnits( "1" , 18 ));
    // expect(await contractAdmin.connect(addr1).incentivePaid(programCode,addr1.address)).to.equal(ethers.utils.parseUnits( "2" , 18 ));



  });

  it('Should approve right incentive not over Referrer LIMIT', async function () {

    // Approve
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[200,1],[50,0]);
    expect(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address)).to.equal(ethers.utils.parseUnits( "2" , 18 ));

    // Claim token
    await contractAdmin.connect(addr1).claim(programCode);
    await expect(contractAdmin.connect(addr2).claim(programCode)).to.be.reverted;

    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "2" , 18 ));
    expect(await rirToken.balanceOf(addr2.address)).to.equal(0);

    const program = await contractAdmin.programs(programCode);
    expect(program.tokenAmountIncentive).to.equal(ethers.utils.parseUnits( "2.02" , 18 ));

  });

  it('Should claim incentive not over Value Required', async function () {

    // Update setting
    await contractAdmin.updateLimitClaim(programCode, ethers.utils.parseUnits( "1" , 18));

    // Approve
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[100,1],[50,0]);

    // Claim token
    await contractAdmin.connect(addr1).claim(programCode);
    await expect(contractAdmin.connect(addr2).claim(programCode)).to.be.reverted;

    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "2" , 18 ));
    expect(await rirToken.balanceOf(addr2.address)).to.equal(0);

    const program = await contractAdmin.programs(programCode);
    expect(program.tokenAmountIncentive).to.equal(ethers.utils.parseUnits( "2.02" , 18 ));

  });

  it('Should approve right incentive and paid more', async function () {

    // Approve
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[52,101],[1,0]);

    // Claim token
    await contractAdmin.connect(addr1).claim(programCode);
    await contractAdmin.connect(addr2).claim(programCode);

    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "1" , 18 ));
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "2" , 18 ));

    var program = await contractAdmin.programs(programCode);
    expect(program.tokenAmountIncentive).to.equal(ethers.utils.parseUnits( "3.042" , 18 ));

    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address],[102],[1]);
    expect(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address)).to.equal(ethers.utils.parseUnits( "1" , 18 ));

    // Claim token
    await contractAdmin.connect(addr1).claim(programCode);
    program = await contractAdmin.programs(programCode);
    expect(program.tokenAmountIncentive).to.equal(ethers.utils.parseUnits( "4" , 18 ));

    expect(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr1.address)).to.equal(0);
    expect(await contractAdmin.connect(addr1).claimableApproved(rirToken.address,addr2.address)).to.equal(0);

  });

  it('Should not approve incentive if over allocation of program', async function () {

    await contractAdmin.updateProgram(programCode,
      rirToken.address,
      contractSingle.address,
      ethers.utils.parseUnits( "0.02" , 18),
      ethers.utils.parseUnits( "0.002" , 18),
      ethers.utils.parseUnits( "0.000" , 18),
      ethers.utils.parseUnits( "2" , 18),
      ethers.utils.parseUnits( "1" , 18));

    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address],[50],[0]);
    // Claim token
    // await contractAdmin.connect(addr1).claim(programCode);

    // Join more
    await contractSingle.connect(addr5).joinProgram(programCode, uid5 , uid1);
    // Calculate incentive
    await expect(contractAdmin.connect(addr2).approveIncentive(programCode, [addr3.address],[3],[1])).to.be.reverted;
  });

  it('Should not pay incentive if over allocation of per referrer', async function () {

    await contractAdmin.updateProgram(programCode,
      rirToken.address,
      contractSingle.address,
      ethers.utils.parseUnits( "0.02" , 18),
      ethers.utils.parseUnits( "0.002" , 18),
      ethers.utils.parseUnits( "0.000" , 18),
      ethers.utils.parseUnits( "1" , 18),
      ethers.utils.parseUnits( "10" , 18));

    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[52,101],[0,1]);

    // Claim token
    await contractAdmin.connect(addr1).claim(programCode);
    await contractAdmin.connect(addr2).claim(programCode);

    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "1" , 18 ));
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "1" , 18 ));
  });

  it('Should pause a program', async function () {
    // Set Admin for Single contract
    contractSingle.connect(addr4).setAdmin(contractAdmin.address, true)

    await contractAdmin.connect(addr4).setPause(programCode,true);
    const program = await contractAdmin.programs(programCode);
    expect(program.paused).to.equal(true);

    const programSingle = await contractSingle.programs(programCode);
    expect(programSingle.paused).to.equal(true);

  });
  it('Should update program like incentive, allocation', async function () {

    // Set Admin for Single contract
    contractSingle.connect(addr4).setAdmin(contractAdmin.address, true)

    await contractAdmin.connect(addr4).updateProgram(programCode,
      rirToken.address,
      contractSingle.address,
      ethers.utils.parseUnits( "0.02" , 18),
      ethers.utils.parseUnits( "0.01" , 18),
      ethers.utils.parseUnits( "0.001" , 18),
      ethers.utils.parseUnits( "2" , 18),
      ethers.utils.parseUnits( "5" , 18));

    const program = await contractAdmin.programs(programCode);
    expect(program.tokenAllocation).to.equal(ethers.utils.parseUnits( "5" , 18 ));
  });

  it('Should deny an incentive', async function () {

    // Deny address
    await contractAdmin.connect(addr4).denyAddresses(programCode, [addr1.address]);
    expect(await contractAdmin.denyUser(programCode, addr1.address)).to.equal(true);

    // Approve
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[2,50],[0,50]);

    // Claim token
    await expect(contractAdmin.connect(addr1).claim(programCode)).to.be.reverted;
    await contractAdmin.connect(addr2).claim(programCode);

    expect(await rirToken.balanceOf(addr1.address)).to.equal(0);
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "1" , 18 ));

    const program = await contractAdmin.programs(programCode);
    expect(program.tokenAmountIncentive).to.equal(ethers.utils.parseUnits( "1.1" , 18 ));
  });

});
