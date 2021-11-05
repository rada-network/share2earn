// SPDX-License-Identifier: MIT
// pragma solidity >=0.8.0 <=0.8.4;
pragma solidity 0.8.2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./ValidUserContract.sol";

contract ReferralContract is Initializable, UUPSUpgradeable, OwnableUpgradeable { // ERC20Upgradeable,

    address public admin;
    ValidUserContract private validUserContract;

    // Config programs
    mapping(string => bool) public paused;

    mapping(string => address) public programs;
    mapping(string => mapping (string => uint)) public programIncentive;

    // Config users
    mapping(string => mapping (string => bool)) public uidJoined;
    mapping(string => mapping(address => address)) public rUserFromUser;
    mapping(string => mapping(address => address[])) public userFollowers;
    // mapping(address => mapping(address => bool)) public paidIncentive;

    // mapping(address => address) public referUserFromUser;
    // mapping(address => string) public addressWithReferCode;
    // mapping(address => address[]) public usersFollow;

    IERC20 public token;

    function initialize(address _validUserAddresses) initializer public {
        __Ownable_init();

        admin = msg.sender;

        // Get instance ValidUserContract
        validUserContract = ValidUserContract(_validUserAddresses);
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // referCode is uid
    function joinProgram(string memory programCode, string memory referCode) public {

        require(paused[programCode] == false , "Program is pausing");
        require(programs[programCode] != address(0) , "Program not found");

        bytes memory haveReferralCode = bytes(referCode);
        if (haveReferralCode.length > 0) {
            // Check uid exist
            require(validUserContract.uidUsers(referCode) != address(0) , "Not found refer code");
            // Check join myself
            require(msg.sender != validUserContract.uidUsers(referCode) , "Cannot join yourself");
        }

        // Get uid of this user
        string memory uid = validUserContract.addressUsers(msg.sender);
        bytes memory checkValidUser = bytes(uid);
        // Check validUser
        require(checkValidUser.length > 0 , "The user is not enabled");

        require(uidJoined[programCode][uid] == false , "The user joined");


        // Claim reward to Referral
        if (haveReferralCode.length > 0) {
            // Owner of refer code
            address referOwner = validUserContract.uidUsers(referCode);

            bool allowIncentive = true;

            // if refer owner already got incentive from this sender then return
            if (rUserFromUser[programCode][msg.sender] != address(0)) {
                allowIncentive = false;
            }
            if (uidJoined[programCode][uid] == true) {
                allowIncentive = false;
            }

            if (allowIncentive) {
                address tokenAddress = programs[programCode];
                token = IERC20(tokenAddress);
                // Assign new address to ReferralUser
                rUserFromUser[programCode][msg.sender] = referOwner;
                // User follow
                userFollowers[programCode][referOwner].push(msg.sender);

                // Paid incentive
                // paidIncentive[programCode][msg.sender] = true;

                // Pay for level up 1
                if (programIncentive[programCode]['amountIncentiveL0'] > 0)
                    token.transfer(referOwner, programIncentive[programCode]['amountIncentiveL0']);

                // Check Level 1 up
                address userL0 = rUserFromUser[programCode][referOwner];
                if (userL0 != address(0)) {
                    // Pay for level up 2
                    if (programIncentive[programCode]['amountIncentiveL1']>0)
                        token.transfer(userL0, programIncentive[programCode]['amountIncentiveL1']);

                    // Level 2 up
                    address userL1 = rUserFromUser[programCode][userL0];
                    if (userL1 != address(0)) {
                        // Pay for level up 3
                        if (programIncentive[programCode]['amountIncentiveL2']>0)
                        token.transfer(userL1, programIncentive[programCode]['amountIncentiveL2']);
                    }
                }


            }
        }
                // add user to program
        uidJoined[programCode][uid] = true;

    }


    // Add new program
    function addProgram(string memory programCode, address tokenAddress) onlyOwner public {
        require(programs[programCode] == address(0) , "Program is existing");
        programs[programCode] = tokenAddress;
        programIncentive[programCode]['amountIncentiveL0'] = 2 * 10 ** 18 / 100;  // Default 0.02 token
        programIncentive[programCode]['amountIncentiveL1'] = 1 * 10 ** 18 / 100;  // Default 0.01 token
        programIncentive[programCode]['amountIncentiveL2'] = 1 * 10 ** 18 / 1000; // Default 0.001 token

        // Approve
        // token = IERC20(tokenAddress);
        // token.approve(msg.sender, token.balanceOf(address(this)));
    }
    // Remove program
    function removeCampaign(string memory programCode) onlyOwner public {
        require(programs[programCode] != address(0) , "Program not found");
        programs[programCode] = address(0);
    }

    function transferBack(address tokenAddress, uint amount) onlyOwner public {
        token = IERC20(tokenAddress);
        require(token.balanceOf(address(this)) > amount , "Amount exceeds");
        token.transfer(msg.sender, amount);
    }

    //
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

    /*     uint256 constant private salt =  block.timestamp;

    function random(uint Max) constant private returns (uint256 result){
        //get the best seed for randomness
        uint256 x = salt * 100/Max;
        uint256 y = salt * block.number/(salt % 5) ;
        uint256 seed = block.number/3 + (salt % 300) + Last_Payout + y;
        uint256 h = uint256(block.blockhash(seed));

        return uint256((h / x)) % Max + 1; //random number between 1 and Max
    } */

    // This referral code is unique with each address
    /* function random() private view returns (uint) {
        uint randomHash = uint(keccak256(abi.encodePacked(msg.sender)));
        return uint(randomHash % (10 ** 20));
    } */
    // Helpers function
    /* function myReferCode() public view returns (string memory) {
        return validUserContract.addressUsers(msg.sender);
    } */
    function version() virtual pure public returns (string memory) {
        return "v1";
    }
    function getUserUid(address userAddress) public view returns (string memory) {
        return validUserContract.addressUsers(userAddress);
    }
    /*
    // Not work with upgradeable Contract
    function getMyUid() public view returns (string memory) {
        return validUserContract.addressUsers(msg.sender);
    }*/
    function checkJoined(string memory programCode, address userAddress) public view returns (bool) {
        return rUserFromUser[programCode][userAddress] != address(0);
    }

    // Debug function
    /* function z_myBalance() public view returns (uint) {
        return msg.sender.balance;
    }
    function z_myTokenBalance() public view returns (uint) {
        return token.balanceOf(msg.sender);
    }

    function z_clearData() onlyOwner public {
        // require(msg.sender == admin, "Access denied");
        uint usersLength = users.length;
        for (uint i=0; i<usersLength; i++) {
            address user = users[i];
            uint code = addressWithReferCode[user];
            delete addressWithReferCode[user];
            delete referCodeWidthAddress[code];
            for (uint j=0; j<usersLength; j++) {
                // address user2 = users[j];
                // delete referralAddressWidthAddress[user][user2];
                delete referUserFromUser[user];
            }
        }
        for (uint i=0; i<usersLength; i++) {
            delete users[i];
        }
    } */

    function z_leaveProgram(string memory programCode) public {
        string memory uid = validUserContract.addressUsers(msg.sender);
        uidJoined[programCode][uid] = false;
        // rUserFromUser[tokenAddress][msg.sender] = address(0);
    }
    /* function z_contractBalance() public view returns (uint) {
        return token.balanceOf(address(this));
    } */

}
