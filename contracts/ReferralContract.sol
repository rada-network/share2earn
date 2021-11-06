// SPDX-License-Identifier: MIT
// pragma solidity >=0.8.0 <=0.8.4;
pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ReferralContract is Initializable, UUPSUpgradeable, OwnableUpgradeable { // ERC20Upgradeable,

    struct Program {
        string code;
        address tokenAddress;
        uint incentiveL0;
        uint incentiveL1;
        uint incentiveL2;
        bool paused;
    }

    address public admin;

    // Config programs
    mapping(string => bool) public paused;

    mapping(string => Program) public programs;

    // Config users
    mapping(string => mapping(string => address)) public uidJoined; // program code => uid => sender address
    mapping(string => mapping(address => address)) public rUserFromUser; // program code => sender address => refer address
    mapping(string => mapping(address => address[])) public userFollowers; // program code => refer address  => user address[]
    mapping(string => address) public userJoined; // uid => user address
    mapping(address => string) public addressJoined; // user address => uid

    IERC20 public token;

    // DEBUG
    string public debug;

    function initialize() initializer public {
        __Ownable_init();

        admin = msg.sender;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // referCode is uid
    function joinProgram(string memory programCode, string memory uid, string memory referCode) public {

        require(paused[programCode] == false , "Program is pausing");
        require(programs[programCode].tokenAddress != address(0) , "Program not found");

        bytes memory haveReferralCode = bytes(referCode);
        if (haveReferralCode.length > 0) {
            require(keccak256(bytes(uid)) != keccak256(bytes(referCode)), "Cannot join yourself");

            require(userJoined[referCode] != address(0), "Wrong refer code");
        }

        require(uidJoined[programCode][uid] == address(0) , "User joined");

        // Validate, check this address joined but uid not the same
        if (rUserFromUser[programCode][msg.sender] != address(0)) {
            require(keccak256(bytes(uid)) == keccak256(bytes(addressJoined[msg.sender])) , "This uid used other address");
        }
        // Claim reward to Referral
        if (haveReferralCode.length > 0) {
            // Owner of refer code
            address referOwner = userJoined[referCode];

            bool allowIncentive = true;

            // if refer owner already got incentive from this sender then return
            if (rUserFromUser[programCode][msg.sender] != address(0)) {
                allowIncentive = false;
            }

            if (allowIncentive) {
                address tokenAddress = programs[programCode].tokenAddress;
                token = IERC20(tokenAddress);
                // Assign new address to ReferralUser
                rUserFromUser[programCode][msg.sender] = referOwner;
                // User follow
                userFollowers[programCode][referOwner].push(msg.sender);

                // Pay for level up 1
                if (programs[programCode].incentiveL0 > 0) {
                    token.transfer(referOwner, programs[programCode].incentiveL0);
                }

                debug = 'allowIncentive';

                // Check Level 1 up
                address userL0 = rUserFromUser[programCode][referOwner];
                if (userL0 != address(0)) {
                    // Pay for level up 2
                    if (programs[programCode].incentiveL1>0)
                        token.transfer(userL0, programs[programCode].incentiveL1);

                    // Level 2 up
                    address userL1 = rUserFromUser[programCode][userL0];
                    if (userL1 != address(0)) {
                        // Pay for level up 3
                        if (programs[programCode].incentiveL2>0)
                        token.transfer(userL1, programs[programCode].incentiveL2);
                    }
                }


            }
        }
        // add user to program
        uidJoined[programCode][uid] = msg.sender;
        userJoined[uid] = msg.sender;
        addressJoined[msg.sender] = uid;
    }

    // Add new program
    function addProgram(string memory programCode, address tokenAddress) onlyOwner public {
        require(programs[programCode].tokenAddress == address(0) , "Program is existing");
        programs[programCode] = Program({
            code: programCode,
            tokenAddress: tokenAddress,
            paused: false,
            incentiveL0: 2 * 10 ** 18 / 100,  // Default 0.02 token
            incentiveL1: 1 * 10 ** 18 / 100,  // Default 0.01 token
            incentiveL2: 1 * 10 ** 18 / 1000 // Default 0.001 token
        });

    }
    // Remove program
    function removeCampaign(string memory programCode) onlyOwner public {
        require(programs[programCode].tokenAddress != address(0) , "Program not found");
        delete programs[programCode];
    }

    // Allow owner transfer back Token
    function transferBack(address tokenAddress, uint amount) onlyOwner public {
        token = IERC20(tokenAddress);
        require(token.balanceOf(address(this)) > amount , "Amount exceeds");
        token.transfer(msg.sender, amount);
    }

    function setPause(string memory programCode) onlyOwner public {
        require(programs[programCode].paused == false , "Program is running");
        programs[programCode].paused = true;
    }
    function setUnPause(string memory programCode) onlyOwner public {
        require(programs[programCode].paused == true , "Program is pausing");
        programs[programCode].paused = false;
    }
    function setIncentiveAmountL0(string memory programCode, uint amount) onlyOwner public {
        programs[programCode].incentiveL0 = amount;
    }
    function setIncentiveAmountL1(string memory programCode,uint amount) onlyOwner public {
        programs[programCode].incentiveL1 = amount;
    }
    function setIncentiveAmountL2(string memory programCode,uint amount) onlyOwner public {
        programs[programCode].incentiveL2 = amount;
    }

    function version() virtual pure public returns (string memory) {
        return "v1";
    }

    function checkJoined(string memory programCode, address userAddress) public view returns (bool) {
        return rUserFromUser[programCode][userAddress] != address(0);
    }
    function getInfoProgram(string memory programCode) public view returns (Program memory) {
        Program memory program = programs[programCode];
        return program;
    }
    function leaveProgram(string memory programCode) public {
        string memory uid = addressJoined[msg.sender];
        uidJoined[programCode][uid] = address(0);
    }
}
