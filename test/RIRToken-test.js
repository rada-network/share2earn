// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers } = require('hardhat');

describe("RIR Token Contract", function () {

  let Token;
  let token;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    Token = await ethers.getContractFactory("RIRToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    token = await Token.deploy();
  });

  it('Deploy contract', async function () {
    expect(await token.name()).to.equal("Rada Token");
  });
  it("Should set the right owner", async function () {
    expect(await token.admin()).to.equal(owner.address);
  });
  it("Should assign the total supply of tokens to the owner", async function () {
    const ownerBalance = await token.balanceOf(owner.address);
    expect(await token.totalSupply()).to.equal(ownerBalance);
  });

  it("Should transfer tokens between accounts", async function () {
    // Transfer 50 tokens from owner to addr1
    await token.transfer(addr1.address, 50);
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(50);

    // Transfer 50 tokens from addr1 to addr2
    // We use .connect(signer) to send a transaction from another account
    await token.connect(addr1).transfer(addr2.address, 50);
    const addr2Balance = await token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(50);
  });

  it("Should fail if sender doesn’t have enough tokens", async function () {
    const initialOwnerBalance = await token.balanceOf(owner.address);


    // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
    // `require` will evaluate false and revert the transaction.
    await expect(
      token.connect(addr1).transfer(owner.address, 1)
    ).to.be.reverted;

    // Owner balance shouldn't have changed.
    expect(await token.balanceOf(owner.address)).to.equal(
      initialOwnerBalance
    );
  });

  it("Should update balances after transfers", async function () {
    const initialOwnerBalance = await token.balanceOf(owner.address);

    // Transfer 0.5 tokens from owner to addr1.
    await token.transfer(addr1.address, ethers.utils.parseUnits( "0.5" , 18 )); //

    // Transfer another 50 tokens from owner to addr2.
    await token.transfer(addr2.address, ethers.utils.parseUnits( "50" , 18 ));
    // Check balances.
    const finalOwnerBalance = await token.balanceOf(owner.address);
    expect(finalOwnerBalance).to.not.equal(initialOwnerBalance);
    // expect(ethers.utils.formatUnits(finalOwnerBalance,0)).to.equal("99998500000000000000000000");
    const addr1Balance = await token.balanceOf(addr1.address);
    // console.log(ethers.utils.formatUnits(addr1Balance,18));

    expect(addr1Balance).to.equal(ethers.utils.parseUnits( "0.5" , 18 ));

    const addr2Balance = await token.balanceOf(addr2.address);
    // console.log(ethers.utils.formatUnits(addr2Balance,18));

    expect(addr2Balance).to.equal(ethers.utils.parseUnits( "50" , 18 ));
  });
  it("Should burn tokens from user or owner", async function () {
    const ownerBalance = await token.balanceOf(owner.address);

    await token.burn(ethers.utils.parseUnits( "10" , 18 ))
    const ownerAfterBurnBalance = await token.balanceOf(owner.address);
    expect(ownerAfterBurnBalance).to.not.equal(ownerBalance);

    // Transfer 10 tokens from owner to addr1.
    await token.transfer(addr1.address, ethers.utils.parseUnits( "10" , 18 ));

    // Burn 4 tokens from other address
    await token.connect(addr1).burn(ethers.utils.parseUnits( "4" , 18 ));
    const addr1Balance = await token.balanceOf(addr1.address);

    expect(addr1Balance).to.equal(ethers.utils.parseUnits( "6" , 18 ));
  });

});