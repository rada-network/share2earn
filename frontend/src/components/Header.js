import { Button } from "@mui/material"
import { makeStyles } from '@mui/styles';

import { useEthers } from "@usedapp/core"

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

    const { account, activateBrowserWallet, deactivate } = useEthers()

    const isConnected = account !== undefined

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
                    onClick={() => activateBrowserWallet()}
                >
                    Connect
                </Button>
            )}
        </div>
    )
}