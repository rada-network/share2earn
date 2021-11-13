import { useEffect } from "react"
import { constants, ethers } from "ethers";
import { useEthers, useContractCall, useContractFunction } from "@usedapp/core";
import { Contract } from '@ethersproject/contracts'
import ReferralContract from "../chain-info/contracts/ReferralContract.json"
import ValidUserContract from "../chain-info/contracts/ValidUserContract.json"

import networkMapping from "../network-config"

const { abi: abiReferral } = ReferralContract
const referralContractInterface = new ethers.utils.Interface(abiReferral);
const { abi: abiValidUser } = ValidUserContract
const validUserContractInterface = new ethers.utils.Interface(abiValidUser);


export function useContractMethod(methodName) {

  const { chainId } = useEthers()
  const contractAddress = chainId ? networkMapping[String(chainId)]["referral_contract"] : constants.AddressZero
  const contract = new Contract(contractAddress, referralContractInterface);


  const { state, send } = useContractFunction(contract, methodName);

    //useEffect
    /* useEffect(() => {referralContractInterface
      console.log(state);
    }, [state]) */

  return { state, send };
}
export function useEnableValidUser() {

  const { chainId } = useEthers()
  const contractAddress = chainId ? networkMapping[String(chainId)]["valid_user_contract"] : constants.AddressZero
  const contract = new Contract(contractAddress, validUserContractInterface);

  const { state, send } = useContractFunction(contract, "setUser");

  return { state, send };
}
export function useDisableValidUser() {

  const { chainId } = useEthers()
  const contractAddress = chainId ? networkMapping[String(chainId)]["valid_user_contract"] : constants.AddressZero
  const contract = new Contract(contractAddress, validUserContractInterface);

  const { state, send } = useContractFunction(contract, "unsetUser");

  return { state, send };
}
export function useTokenAddress() {

  const { chainId } = useEthers()
  const contractAddress = chainId ? networkMapping[String(chainId)]["referral_contract"] : constants.AddressZero

  const [token] = useContractCall({
    abi: referralContractInterface,
    address: contractAddress,
    method: "token",
    args: [],
  }) ?? [];

  return token;
}

/* export function useGetMyUid() {

  const { account } = useEthers()
  const defaultChainId = '97';

  const contractAddress = networkMapping[defaultChainId]["valid_user_contract"];
  const [uid] = useContractCall(account && {
    abi: validUserContractInterface,
    address: contractAddress,
    method: "addressUsers",
    args: [account],
  }) ?? [];
  return uid;
} */
export function useGetProgram(code) {

  const { account } = useEthers()
  const defaultChainId = '97';

  const contractAddress = networkMapping[defaultChainId]["referral_contract"];
  const program = useContractCall(account && {
    abi: referralContractInterface,
    address: contractAddress,
    method: "getInfoProgram",
    args: [code],
  }) ?? [];
  return program==[] ? null : program;
}

export function useJoined(uid) {

  const defaultChainId = '97';
  const contractAddress = networkMapping[defaultChainId]["referral_contract"];

  const [addressJoined] = useContractCall(uid && {
    abi: referralContractInterface,
    address: contractAddress,
    method: "userJoined",
    args: [uid],
  }) ?? [];

  return addressJoined;
}
export function useJoinedAddress() {
  const { account } = useEthers()

  const defaultChainId = '97';
  const contractAddress = networkMapping[defaultChainId]["referral_contract"];

  const [uid] = useContractCall(account && {
    abi: referralContractInterface,
    address: contractAddress,
    method: "addressJoined",
    args: [account],
  }) ?? [];

  return uid;
}


export function useCheckJoin(programCode,uid) {

  const defaultChainId = '97';
  const contractAddress = networkMapping[defaultChainId]["referral_contract"];

  const [joined] = useContractCall(uid && {
    abi: referralContractInterface,
    address: contractAddress,
    method: "uidJoined",
    args: [programCode,uid],
  }) ?? [];

  return joined;
}
