/* eslint-disable spaced-comment */
/// <reference types="react-scripts" />
import React from "react"

import { useEthers } from "@usedapp/core"
import networkMapping from "../network-config.js"
import { constants } from "ethers"
import dapp from "../dapp.png"
import meo from "../meo.png"
import { YourWallet } from "./yourWallet"
import { makeStyles } from '@mui/styles';
import {  Button,ListItemText, DialogTitle,Dialog,List,ListItem,Link } from "@mui/material"


const useStyles = makeStyles({
    title: {
        color: '#000',
        textAlign: "center",
        padding: 24
    }
})

export const Main = () => {
    // Show token values from the wallet
    // Get the address of different tokens
    // Get the balance of the users wallet
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (value) => {
        setOpen(false);
    };


    // send the brownie-config to our `src` folder
    // send the build folder
    const classes = useStyles()
    // const { chainId, error } = useEthers()
    const chainId = "97"
    // const networkName = "rinkeby"
    const rirTokenAddress = chainId ? networkMapping[String(chainId)]["rir_token"] : constants.AddressZero
    const meoTokenAddress = chainId ? networkMapping[String(chainId)]["meo_token"] : constants.AddressZero

    const referralContractAddress = chainId ? networkMapping[String(chainId)]["referral_contract"] : constants.AddressZero
    const validUserContractAddress = chainId ? networkMapping[String(chainId)]["valid_user_contract"] : constants.AddressZero

    const supportedTokens = [
        {
            image: dapp,
            address: rirTokenAddress,
            name: "RIR Token"
        },
        {
            image: meo,
            address: meoTokenAddress,
            name: "MEO Token"
        },
    ]

    return (<>
        <h2 className={classes.title}>Referral Program Demo <Button variant="outlined" onClick={handleClickOpen}>
        Addresses
        </Button></h2>
        <YourWallet supportedTokens={supportedTokens} />
        <Dialog onClose={handleClose} open={open}>
                <DialogTitle>Contract Addresses</DialogTitle>
                <List sx={{ pt: 0 }}>
                    <ListItem secondaryAction={
                        <Link href={`https://testnet.bscscan.com/address/${referralContractAddress}`} target="_blank">view</Link>
                    }>
                        <ListItemText primary={referralContractAddress} secondary="Referral Contract" />
                    </ListItem>
                    {/* <ListItem secondaryAction={
                        <Link href={`https://testnet.bscscan.com/address/${validUserContractAddress}`} target="_blank">view</Link>
                    }>
                        <ListItemText primary={validUserContractAddress} secondary="Valid User Contract" />
                    </ListItem> */}
                    <ListItem secondaryAction={
                        <Link href={`https://testnet.bscscan.com/address/${rirTokenAddress}`} target="_blank">view</Link>
                    }>
                        <ListItemText primary={rirTokenAddress} secondary="RIR Token" />
                    </ListItem>
                    <ListItem secondaryAction={
                        <Link href={`https://testnet.bscscan.com/address/${meoTokenAddress}`} target="_blank">view</Link>
                    }>
                        <ListItemText primary={meoTokenAddress} secondary="MEO Token" />
                    </ListItem>
                </List>
                </Dialog>
    </>)
}