import React, { useState, useEffect } from "react"
import { Tab, Box, Button,Snackbar, Card, Typography,CardActions, CardContent,Divider, DialogTitle,Dialog,List,ListItem } from "@mui/material"
import { makeStyles } from '@mui/styles';
import { TabContext, TabList, TabPanel } from "@mui/lab"
import { useEthers } from "@usedapp/core"

import { WalletBalance } from "./WalletBalance"
import { ContractBalance } from "./ContractBalance"

import config from "../../network-config"
import { useContractMethod, useGetMyUid, useEnableValidUser,useDisableValidUser,useCheckJoin } from "../../hooks";



const useStyles = makeStyles({
    tabContent: {
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        gap: 24
    },
    box: {
        padding: 16,
        marginTop: 20,
        backgroundColor: "white",
        borderRadius: "25px"
    },
    header: {
        color: "#000"
    },
    rightAlignItem: {
        justifyContent: "end"
    },
    uid: {
        paddingTop: 8,
        paddingBottom: 8,
    }

})

const bull = (
    <Box
        component="span"
        sx={{ display: 'inline-block', mx: '2px', transform: 'scale(0.8)' }}
        >
        •
        </Box>
    );

export const YourWallet = ({ supportedTokens }) => {


    const { chainId, account } = useEthers()
    const [errorMessage, setErrorMessage] = React.useState('');

    const { state: joinStateRIR, send: joinProgramRIR } = useContractMethod("joinProgram");
    const { state: removeStateRIR, send: leaveProgramRIR } = useContractMethod("z_leaveProgram");

    const { state: joinStateMEO, send: joinProgramMEO } = useContractMethod("joinProgram");
    const { state: removeStateMEO, send: leaveProgramMEO } = useContractMethod("z_leaveProgram");

    const { state: joinStateRIRII, send: joinProgramRIRII } = useContractMethod("joinProgram");
    const { state: removeStateRIRII, send: leaveProgramRIRII } = useContractMethod("z_leaveProgram");


    const { state: enableState, send: enableValidUser } = useEnableValidUser();
    const { state: disableState, send: disableValidUser } = useDisableValidUser();

    const defaultChainId = '97';

    var myUid = useGetMyUid();
    var joinedRIR = useCheckJoin("RIRProgram",myUid);
    var joinedMEO = useCheckJoin("MEOProgram",myUid);
    var joinedRIRII = useCheckJoin("RIRProgramII",myUid);

    useEffect(() => {
        if (joinStateRIR.status==="Success" || removeStateRIR.status==="Success" || joinStateMEO.status==="Success" || removeStateMEO.status==="Success" || joinStateRIRII.status==="Success" || removeStateRIRII.status==="Success" || enableState.status==="Success" || disableState.status==="Success" ) {
            // window.location.reload();
        } else if (joinStateRIR.status==="Exception") {
            setErrorMessage(joinStateRIR.errorMessage);
        } else if (joinStateMEO.status==="Exception") {
            setErrorMessage(joinStateMEO.errorMessage);
        }else if (joinStateRIRII.status==="Exception") {
            setErrorMessage(joinStateRIRII.errorMessage);
        }

        if (removeStateRIR.status==="Exception") {
            setErrorMessage(removeStateRIR.errorMessage);
        } else if (removeStateMEO.status==="Exception") {
            setErrorMessage(removeStateMEO.errorMessage);
        } else if (enableState.status==="Exception") {
            setErrorMessage(enableState.errorMessage);
        } else if (disableState.status==="Exception") {
            setErrorMessage(disableState.errorMessage);
        } else if (removeStateRIRII.status==="Exception") {
            setErrorMessage(removeStateRIRII.errorMessage);
        }

    }, [joinStateRIR, removeStateRIR,joinStateMEO,removeStateMEO, joinStateRIRII, removeStateRIRII,enableState,disableState])

    const [selectedTokenIndex, setSelectedTokenIndex] = useState(0)

    const handleChange = (event, newValue) => {
        setSelectedTokenIndex(parseInt(newValue))
    }
    const handleJoinProgram = (program,event) => {

        var url_string = window.location.href;
        var url = new URL(url_string);
        var referral = url.searchParams.get("ref");

        if (program==='RIRProgram') {
            joinProgramRIR(program, referral ?? '');
        } else if (program==='MEOProgram') {
            joinProgramMEO(program, referral ?? '');
        }else if (program==='RIRProgramII') {
            joinProgramRIRII(program, referral ?? '');
        }
    }

    const handleLeave = (program) => {
        if (program==='RIRProgram') {
            // const addr = config[String(chainId)]["rir_token"]
            leaveProgramRIR(program);
        } else if (program==='MEOProgram') {
            // const addr = config[String(chainId)]["meo_token"]
            leaveProgramMEO(program);
        } else if (program==='RIRProgramII') {
            // const addr = config[String(chainId)]["meo_token"]
            leaveProgramRIRII(program);
        }
    }
    const handleEnable = () => {
        const uid = makeUid(12);
        enableValidUser(account,uid);
    }
    const handleDisable = () => {
        disableValidUser(account)
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

    };

    const makeUid = (length) => {
        var result           = '';
        var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() *charactersLength));
        }
        return result;
    }


    const classes = useStyles()


    return (
        <Box>
            { account && <Box className={classes.box}>
            {account && <div> Your Wallet is {account}</div>}
            {myUid && <div className={classes.uid}>Your UID: <b>{myUid}</b></div> }
            {account && !myUid && <Button variant="contained" onClick={handleEnable} disabled={enableState.status==="Mining"}>
                            Enable to be Valid User (for demo, admin will do this action) {enableState.status==="Mining" && ", please wait (30s)..."}
                        </Button> }
            {/* {account && myUid && <Button variant="contained" onClick={handleDisable}>
                Disable me (for demo) {disableState.status==="Mining" && ", please wait (30s)..."}
            </Button> } */}
            {/* {token && <h3>Token RIR Address: {token}</h3> } */}
            {/* {myUid && <h3>Referral Code: {myUid}</h3> } */}
            {account && myUid && <div>Link referral: <b>{config.appUrl}/?ref={myUid}</b></div> }
            </Box> }
            <Divider style={{marginTop: 16,marginBottom: 16}} />
            <Box className={classes.box} >
                <h3>Your Balance</h3>
                {supportedTokens.map((token, index) => {
                        return (
                            <div className={classes.tabContent}>
                                <WalletBalance token={supportedTokens[index]} />
                            </div>
                        )
                })}
                <h3>Referral Contract Balance</h3>
                {supportedTokens.map((token, index) => {
                        return (
                            <div className={classes.tabContent}>
                                <ContractBalance token={supportedTokens[index]} account={config["97"]["referral_contract"]} />
                            </div>
                        )
                })}
            </Box>
            <Divider style={{marginTop: 16,marginBottom: 16}} />
            <Card sx={{ minWidth: 275 }}>
                <CardContent>
                <Typography align="left" variant="h5" component="div">
                RADA Investment Program {bull} RIR Token
                </Typography>
                <Typography align="left" sx={{ mb: 1.5 }} color="text.secondary">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </Typography>
                </CardContent>
                <CardActions className={classes.rightAlignItem} >
                    {account && !joinedRIR && <Button disabled={!myUid || joinStateRIR.status==="Mining"} variant="contained" onClick={(e) => handleJoinProgram('RIRProgram',e)}>
                            Join Program {joinStateRIR.status==="Mining" && ", joining (30s)..."}
                        </Button>
                    }
                    {account && joinedRIR && <Button disabled={removeStateRIR.status==="Mining"} variant="contained" onClick={(e) => handleLeave('RIRProgram')} color="warning">
                        Leave (for demo) {removeStateRIR.status==="Mining" && "Leaving  (30s)..."}
                        </Button>
                    }
                </CardActions>
            </Card>
            <Divider style={{marginTop: 16,marginBottom: 16}} />
            <Card sx={{ minWidth: 275 }}>
                <CardContent>
                <Typography align="left" variant="h5" component="div">
                MEO IDO Program {bull} MEO Token
                </Typography>
                <Typography align="left" sx={{ mb: 1.5 }} color="text.secondary">
                Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...
                </Typography>
                </CardContent>
                <CardActions className={classes.rightAlignItem} >
                    {account && !joinedMEO && <Button disabled={!myUid || joinStateMEO.status==="Mining"} variant="contained" onClick={(e) => handleJoinProgram('MEOProgram',e)}>
                            Join Program {joinStateMEO.status==="Mining" && ", joining (30s)..."}
                        </Button>
                    }
                    {account && joinedMEO && <Button disabled={removeStateMEO.status==="Mining"} variant="contained" onClick={(e) => handleLeave('MEOProgram',e )} color="warning">
                        Leave (for demo) {removeStateMEO.status==="Mining" && "Leaving  (30s)..."}
                        </Button>
                    }
                </CardActions>
            </Card>
            <Divider style={{marginTop: 16,marginBottom: 16}} />
            <Card sx={{ minWidth: 275 }}>
                <CardContent>
                <Typography align="left" variant="h5" component="div">
                RADA Investment Program version II {bull} RIR Token
                </Typography>
                <Typography align="left" sx={{ mb: 1.5 }} color="text.secondary">
                Version II. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </Typography>
                </CardContent>
                <CardActions className={classes.rightAlignItem} >
                    {account && !joinedRIRII && <Button disabled={!myUid || joinStateRIRII.status==="Mining"} variant="contained" onClick={(e) => handleJoinProgram('RIRProgramII',e)}>
                            Join Program {joinStateRIRII.status==="Mining" && ", joining (30s)..."}
                        </Button>
                    }
                    {account && joinedRIRII && <Button disabled={removeStateRIR.status==="Mining"} variant="contained" onClick={(e) => handleLeave('RIRProgramII')} color="warning">
                        Leave (for demo) {removeStateRIRII.status==="Mining" && "Leaving  (30s)..."}
                        </Button>
                    }
                </CardActions>
            </Card>




            <Snackbar
                anchorOrigin={{ vertical:'top', horizontal:'center' }}
                open={errorMessage !== ''}
                autoHideDuration={6000}
                onClose={handleClose}
                message={errorMessage}
            />


        </Box >
    )

}





