import React, { useState } from "react"

import { Button } from "@mui/material"
import { makeStyles } from '@mui/styles';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';

import { useEthers } from "@usedapp/core"
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'

const walletConnect = new WalletConnectConnector({
    rpc: { 97: "https://data-seed-prebsc-1-s1.binance.org:8545/" },
    qrcode: true
})

const useStyles = makeStyles({
    container: {
        padding: 16,
        display: "flex",
        justifyContent: "flex-end",
        gap: 4
    },
})

export const Header = () => {
    const classes = useStyles()

    const [openConnect, setOpenConnect] = useState(false);

    const handleClose = () => {
        setOpenConnect(false);
    };
    const handleClickOpen = () => {
        setOpenConnect(true);
    };

    const { account, activateBrowserWallet, deactivate, activate } = useEthers()

    const isConnected = account !== undefined

    const handleChooseWallet = (wallet) => {
        if (wallet=='metaMask') {
            activateBrowserWallet()
        } else if (wallet=='walletConnect') {
            activate(walletConnect)
        }
        setOpenConnect(false);
    }

    return (
        <div className={classes.container}>
            {isConnected ? (
                <Button variant="contained" onClick={deactivate}>
                    Disconnect
                </Button>
            ) : (
                <Button
                    color="primary"
                    variant="contained"
                    onClick={() => handleClickOpen()}
                >
                    Connect Wallet
                </Button>
            )}

            <Dialog onClose={handleClose} open={openConnect}>
                <DialogTitle>Choose Wallet</DialogTitle>
                <DialogContent justifyContent="center">
                    <Box sx={{ flexDirection: 'row', alignItems: 'center',justifyContent: 'space-between' }}>
                        <Button
                            color="primary"
                            variant="contained"
                            onClick={() => handleChooseWallet('metaMask')}
                        >
                            MetaMask
                        </Button>
                        <Box sx={{ m: 1 }} />
                        <Button
                            color="primary"
                            variant="contained"
                            onClick={() => handleChooseWallet('walletConnect')}
                        >
                            WalletConnect
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </div>
    )
}