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
