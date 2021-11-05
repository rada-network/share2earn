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
    /* useEffect(() => {
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

/*
// WORK GOOD
export function useGetMyUid() {

  const { chainId, account } = useEthers()
  const contractAddress = chainId ? networkMapping[String(chainId)]["referral_contract"] : constants.AddressZero

  const [uid] = useContractCall({
    abi: referralContractInterface,
    address: contractAddress,
    method: "getUserUid",
    args: [account],
  }) ?? [];
  return uid;
} */
export function useGetMyUid() {

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
}

/* export function useCheckJoin(tokenAddress) {
  const defaultChainId = '97';
  const contractAddress = networkMapping[defaultChainId]["referral_contract"];

  const [joined] = useContractCall({
    abi: referralContractInterface,
    address: contractAddress,
    method: "checkMyJoined",
    args: [tokenAddress],
  }) ?? [];

  return joined;
} */

/* export function useCheckJoin(tokenAddress) {

  const { account, chainId } = useEthers()
  const defaultChainId = '97';
  const contractAddress = networkMapping[defaultChainId]["referral_contract"];

  const [joined] = useContractCall(account && {
    abi: referralContractInterface,
    address: contractAddress,
    method: "checkJoined",
    args: [tokenAddress,account],
  }) ?? [];

  return joined;
} */

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

// export { useGetCode } from "./useGetCode"

/* export function useContractMethod(methodName,args = {}) {
  const { state, send } = useContractFunction(contract, "incrementCount", {});
  return { state, send };
} */

/* export { useGetCode } from "./useGetCode"
export { useJoinProgram } from "./useJoinProgram"
export { useRemoveMyCode } from "./useRemoveMyCode"
export { ExecuteContract } from "./ExecuteContract"
export { useContractMethod } from "./useContractMethod" */


