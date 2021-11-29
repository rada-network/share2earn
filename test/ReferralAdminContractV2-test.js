// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Referral Admin Contract Version 2", function () {

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
    await rirToken.transfer(contractAdmin.address, ethers.utils.parseUnits( "10" , 18 ));
    await meoToken.transfer(contractAdmin.address, ethers.utils.parseUnits( "10" , 18 ));

    // Set addr4 is Admin
    await contractAdmin.setAdmin(addr4.address, true);

    // Add default program
    await contractAdmin.addProgram(programCode, rirToken.address, contractSingle.address);

    await contractAdmin.updateProgram(programCode,
      rirToken.address,
      contractSingle.address,
      ethers.utils.parseUnits( "0.1" , 18),
      ethers.utils.parseUnits( "0.01" , 18),
      ethers.utils.parseUnits( "0.001" , 18),
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


  it('Should pay right incentive', async function () {

    // Approve
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[ethers.utils.parseUnits( "0.21" , 18 ),ethers.utils.parseUnits( "0.1" , 18 )]);
    // await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],["210000000000000000","100000000000000000"]);


    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.21" , 18 ));
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.1" , 18 ));

    const program = await contractAdmin.programs(programCode);
    expect(program.tokenAmountIncentive).to.equal(ethers.utils.parseUnits( "0.31" , 18 ));

  });

  it('Should pay right incentive and paid more', async function () {

    // Approve
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[ethers.utils.parseUnits( "0.21" , 18 ),ethers.utils.parseUnits( "0.1" , 18 )]);
    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.21" , 18 ));
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.1" , 18 ));

    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address],[ethers.utils.parseUnits( "0.01" , 18 )]);

    const program = await contractAdmin.programs(programCode);
    expect(program.tokenAmountIncentive).to.equal(ethers.utils.parseUnits( "0.32" , 18 ));

  });

  it('Should not pay hold incentive if over allocation of program', async function () {

    await contractAdmin.updateProgram(programCode,
      rirToken.address,
      contractSingle.address,
      ethers.utils.parseUnits( "0.1" , 18),
      ethers.utils.parseUnits( "0.01" , 18),
      ethers.utils.parseUnits( "0.001" , 18),
      ethers.utils.parseUnits( "2" , 18),
      ethers.utils.parseUnits( "0.05" , 18));

    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[ethers.utils.parseUnits( "0.21" , 18 ),ethers.utils.parseUnits( "0.1" , 18 )]);
    // Join more
    await contractSingle.connect(addr5).joinProgram(programCode, uid5 , uid1);
    // Calculate incentive
    await expect(contractAdmin.connect(addr2).approveIncentive(programCode, [addr3.address],[ethers.utils.parseUnits( "0.21" , 18 )])).to.be.reverted;
  });

  it('Should not pay incentive if over allocation of per referrer', async function () {

    await contractAdmin.updateProgram(programCode,
      rirToken.address,
      contractSingle.address,
      ethers.utils.parseUnits( "0.1" , 18),
      ethers.utils.parseUnits( "0.01" , 18),
      ethers.utils.parseUnits( "0.001" , 18),
      ethers.utils.parseUnits( "0.2" , 18),
      ethers.utils.parseUnits( "10" , 18));

    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[ethers.utils.parseUnits( "0.20" , 18 ),ethers.utils.parseUnits( "0.1" , 18 )]);
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[ethers.utils.parseUnits( "0.1" , 18 ),ethers.utils.parseUnits( "0.3" , 18 )]);

    expect(await rirToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseUnits( "0.3" , 18 ));
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.1" , 18 ));
  });

  it('Should not approve incentive if over amount', async function () {

    await expect(contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[ethers.utils.parseUnits( "5" , 18 ),ethers.utils.parseUnits( "6" , 18 )])).to.be.reverted;
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
    await contractAdmin.connect(addr4).denyAddress(programCode, addr1.address);
    expect(await contractAdmin.denyUser(programCode, addr1.address)).to.equal(true);

    // Approve
    await contractAdmin.connect(addr4).approveIncentive(programCode,[addr1.address,addr2.address],[ethers.utils.parseUnits( "0.21" , 18 ),ethers.utils.parseUnits( "0.1" , 18 )]);

    expect(await rirToken.balanceOf(addr1.address)).to.equal(0);
    expect(await rirToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseUnits( "0.1" , 18 ));

    const program = await contractAdmin.programs(programCode);
    expect(program.tokenAmountIncentive).to.equal(ethers.utils.parseUnits( "0.1" , 18 ));
  });

});
