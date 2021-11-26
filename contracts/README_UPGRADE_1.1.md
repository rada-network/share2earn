# V1.1

Add function getTotalJoiners

```shell
function getTotalJoiners(string memory _programCode) public view returns(uint) {
        return joinersAddress[_programCode].length;
}
```

Define event

```shell
event JoinProgram(string _programCode, string _uid, string _referCode);

emit JoinProgram(_programCode, _uid, _referCode);

```

Join program: check valid Referrer exist in this project

```shell
address referrerAddress = uidJoined[_programCode][_referCode];
if (referrerAddress != address(0)) {
  refereesListAddress[_programCode][referrerAddress].push(msg.sender);
  // Save address of referrer
  rUserFromReferer[_programCode][msg.sender] = referrerAddress;
} else {
  _referCode = '';
}
```
