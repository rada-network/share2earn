// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

contract ReferralSingleContract {

    // define event
    event JoinProgram(string _uid, string _referCode);

    address public admin;
    address public addressAdminContract;
    // Config programs
    bool public paused;

    string public programCode;
    uint256 public endTime;

    // Config users
    mapping(string => address) public uidJoined;
    mapping(string => string[]) public refereesList;
    string[] public joiners;

    // Check
    mapping(address => string) public addressJoined; // user address => uid
    mapping(address => address) public rUserFromReferer; // sender address => referrer address


    constructor(string memory _programCode, uint256 _endTime){

        programCode = _programCode;
        endTime = _endTime;

        admin = msg.sender;
    }

    function joinProgram(string memory _uid, string memory _referCode) public {

        require(paused == false , "Program is pausing");
        // Check start/end time
        require(endTime > block.timestamp, "The program has expired");

        require(uidJoined[_uid] == address(0) , "The user joined");

        // Validate, check this address joined but uid not the same
        if (rUserFromReferer[msg.sender] != address(0)) {
            require(keccak256(bytes(_uid)) == keccak256(bytes(addressJoined[msg.sender])) , "This uid used other address");
        }

        bytes memory haveReferralCode = bytes(_referCode);

        if (haveReferralCode.length>0) {
            refereesList[_referCode].push(_uid);
            // Save address of referrer
            address referrerAddress = uidJoined[_referCode];
            rUserFromReferer[msg.sender] = referrerAddress;
        }
        uidJoined[_uid] = msg.sender;
        addressJoined[msg.sender] = _uid;
        joiners.push(_uid);

        emit JoinProgram(_uid, _referCode);
    }

    function setPause(bool _pause) public {
        require((admin == msg.sender || addressAdminContract == msg.sender), "Ownable: caller is not the owner");
        paused = _pause;
    }
    function setAddressAdminContract(address _addressAdminContract) onlyOwner public {
        addressAdminContract = _addressAdminContract;
    }
    function setProgram(string memory _programCode, uint256 _endTime) onlyOwner public {
        programCode = _programCode;
        endTime = _endTime;
    }

    function getJoiners() public view returns(string[] memory) {
        return joiners;
    }
    function getJoinerReferees(string memory _uid) public view returns(string[] memory) {
        return refereesList[_uid];
    }

    modifier onlyOwner() {
        require(admin == msg.sender, "Ownable: caller is not the owner");
        _;
    }
}
