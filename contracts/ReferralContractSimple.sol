// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ReferralContractSimple is Ownable {
    using SafeERC20 for IERC20;

    address public admin;

    // Config programs
    mapping(string => bool) public paused;

    mapping(string => address) public programs;
    mapping(string => mapping(string => uint)) public programIncentive;

    // Config users
    mapping(string => mapping(string => bool)) public uidJoined;
    mapping(string => mapping(address => address)) public rUserFromUser;

    // Check
    mapping(string => address) public userJoined; // uid => user address
    mapping(address => string) public addressJoined; // user address => uid

    IERC20 public token;

    constructor()
    {
        admin = msg.sender;
    }

    // referCode is uid
    function joinProgram(string memory programCode, string memory uid, string memory referCode) public {

        require(paused[programCode] == false , "Program is pausing");
        require(programs[programCode] != address(0) , "Program not found");
        require(uidJoined[programCode][uid] == false , "The user joined");
        bytes memory haveReferralCode = bytes(referCode);

        // Claim reward to Referral
        if (haveReferralCode.length > 0) {
            // Owner of refer code
            address referrerAddress = userJoined[referCode];

            bool allowIncentive = true;

            // if refer owner already got incentive from this sender then return
            if (rUserFromUser[programCode][msg.sender] != address(0)) {
                allowIncentive = false;
            }

            if (allowIncentive) {
                address tokenAddress = programs[programCode];
                token = IERC20(tokenAddress);
                // Assign new address to ReferralUser
                rUserFromUser[programCode][msg.sender] = referrerAddress;

                // Pay for level up 1
                if (programIncentive[programCode]['amountIncentiveL0'] > 0)
                    token.transfer(referrerAddress, programIncentive[programCode]['amountIncentiveL0']);
            }
        }
        // add user to program
        uidJoined[programCode][uid] = true;

        userJoined[uid] = msg.sender;
        addressJoined[msg.sender] = uid;
    }


    // Add new program
    function addProgram(string memory programCode, address tokenAddress) onlyOwner public {
        require(programs[programCode] == address(0) , "Program is existing");
        programs[programCode] = tokenAddress;
        programIncentive[programCode]['amountIncentiveL0'] = 2 * 10 ** 18 / 100;  // Default 0.02 token
        programIncentive[programCode]['amountIncentiveL1'] = 1 * 10 ** 18 / 100;  // Default 0.01 token
        programIncentive[programCode]['amountIncentiveL2'] = 1 * 10 ** 18 / 1000; // Default 0.001 token
    }

    function emergencyWithdrawToken(address _tokenAddress, uint256 _amount) public onlyOwner {
        token = IERC20(_tokenAddress);

        require(token.balanceOf(address(this)) >= _amount , "Amount exceeds");
        token.safeTransfer(owner(), _amount);
    }

    function setPause(string memory programCode) onlyOwner public {
        require(paused[programCode] == false , "Program is running");
        paused[programCode] = true;
    }
    function setUnPause(string memory programCode) onlyOwner public {
        require(paused[programCode] == true , "Program is pausing");
        paused[programCode] = false;
    }
    function setIncentiveAmountL0(string memory programCode, uint amount) onlyOwner public {
        programIncentive[programCode]['amountIncentiveL0'] = amount;
    }
    function setIncentiveAmountL1(string memory programCode,uint amount) onlyOwner public {
        programIncentive[programCode]['amountIncentiveL1'] = amount;
    }
    function setIncentiveAmountL2(string memory programCode,uint amount) onlyOwner public {
        programIncentive[programCode]['amountIncentiveL2'] = amount;
    }
    function checkJoined(string memory programCode, address userAddress) public view returns (bool) {
        return rUserFromUser[programCode][userAddress] != address(0);
    }

}
