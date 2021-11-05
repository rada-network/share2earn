// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract RIRToken is ERC20, Ownable, ERC20Burnable {

    address public admin;
    uint256 public totalTokens;
    // wei
    constructor() ERC20("Rada Token", "RIR") {

        totalTokens = 100 * 10 ** 6 * 10 ** uint256(decimals()); // 100M
        _mint(owner(), totalTokens);
        admin = owner(); // Sets admin address in blockchain
    }
}