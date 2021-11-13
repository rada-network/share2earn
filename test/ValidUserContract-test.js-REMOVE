// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers, upgrades } = require('hardhat');

describe("Valid User Contract", function () {

  let Contract;
  let Token;
  let token;

  beforeEach(async function () {

    // Get the ContractFactory and Signers here.
    Contract = await ethers.getContractFactory("ValidUserContract");

    [owner, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners();
  });

  it('Deploy v1 and should set right owner', async function () {
    const contract = await upgrades.deployProxy(Contract, { kind: 'uups' });
    expect(await contract.admin()).to.equal(owner.address);
  });

  it('Should add user to the Contract', async function () {
    const contract = await upgrades.deployProxy(Contract, { kind: 'uups' });
    await contract.setUser(addr1.address,"123123");
    expect(await contract.addressUsers(addr1.address)).to.equal("123123");
  });

  it('Should check existing user or uid from the Contract', async function () {
    const contract = await upgrades.deployProxy(Contract, { kind: 'uups' });
    await contract.setUser(addr1.address,"123123");
    await expect(contract.setUser(addr2.address,"123123")).to.be.reverted;
    await expect(contract.setUser(addr1.address,"123123")).to.be.reverted;
  });

  it('Should add user, remove and add back to the Contract', async function () {
    const contract = await upgrades.deployProxy(Contract, { kind: 'uups' });
    await contract.setUser(addr2.address,"123123");
    expect(await contract.addressUsers(addr2.address)).to.equal("123123");
    await contract.unsetUser(addr2.address);
    expect(await contract.addressUsers(addr2.address)).to.equal("");
    await contract.setUser(addr2.address,"456456");
    expect(await contract.addressUsers(addr2.address)).to.equal("456456");
  });


});