import React, { useState, useEffect } from "react"
import { Box, Button,Snackbar, Card, Typography,CardActions, CardContent,Divider, List,ListItem, ListItemText } from "@mui/material"
import { makeStyles } from '@mui/styles';
import { useEthers } from "@usedapp/core"
import { formatUnits } from "@ethersproject/units"
import md5 from "md5"


import { WalletBalance } from "./WalletBalance"
import { ContractBalance } from "./ContractBalance"

import config from "../../network-config"
import { useContractMethod, useGetProgram, useEnableValidUser,useDisableValidUser,useCheckJoin, useJoined } from "../../hooks";



const useStyles = makeStyles({
    tabContent: {
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        gap: 24
    },
    boxMain: {
        paddingBottom: 20,
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
    const { state: removeStateRIR, send: leaveProgramRIR } = useContractMethod("leaveProgram");

    const { state: joinStateMEO, send: joinProgramMEO } = useContractMethod("joinProgram");
    const { state: removeStateMEO, send: leaveProgramMEO } = useContractMethod("leaveProgram");

    const { state: joinStateRIRII, send: joinProgramRIRII } = useContractMethod("joinProgram");
    const { state: removeStateRIRII, send: leaveProgramRIRII } = useContractMethod("leaveProgram");


    const { state: enableState, send: enableValidUser } = useEnableValidUser();
    const { state: disableState, send: disableValidUser } = useDisableValidUser();

    const defaultChainId = '97';

    // const cookies = new Cookies();


    /* const makeUid = (length) => {
        var result           = '';
        var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() *charactersLength));
        }
        return result;
    } */

    var myUid = account ? md5(account).substr(3,15): '';

    var addressJoined = useJoined(myUid);
    var joined = addressJoined && addressJoined!='0x0000000000000000000000000000000000000000';

    var joinedRIR = useCheckJoin("RIRProgram",myUid);
    var joinedMEO = useCheckJoin("MEOProgram",myUid);
    var joinedRIRII = useCheckJoin("RIRProgramII",myUid);

    if (joinedRIR=="0x0000000000000000000000000000000000000000")
        joinedRIR = null;
    if (joinedMEO=="0x0000000000000000000000000000000000000000")
        joinedMEO = null;
    if (joinedRIRII=="0x0000000000000000000000000000000000000000")
        joinedRIRII = null;

    // Program information
    var program1 = useGetProgram("RIRProgram");
    var program2 = useGetProgram("MEOProgram");
    var program3 = useGetProgram("RIRProgramII");

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
            joinProgramRIR(program, myUid, referral ?? '');
        } else if (program==='MEOProgram') {
            joinProgramMEO(program, myUid, referral ?? '');
        }else if (program==='RIRProgramII') {
            joinProgramRIRII(program, myUid, referral ?? '');
        }
    }

    const handleLeave = (program) => {
        if (program==='RIRProgram') {
            leaveProgramRIR(program);
        } else if (program==='MEOProgram') {
            leaveProgramMEO(program);
        } else if (program==='RIRProgramII') {
            leaveProgramRIRII(program);
        }
    }

    const handleDisable = () => {
        disableValidUser(account)
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setErrorMessage('');
    };

    const classes = useStyles()

    return (
        <Box className={classes.boxMain}>
            {account && <Box className={classes.box}>
            {account && <div> Your Wallet is {account}</div>}
            {myUid && <div className={classes.uid}>Your UID: <b>{myUid}</b></div> }
            {/* {account && !myUid && <Button variant="contained" onClick={handleEnable} disabled={enableState.status==="Mining"}>
                            Enable to be Valid User (for demo, admin will do this action) {enableState.status==="Mining" && ", please wait (30s)..."}
                        </Button> } */}
            {account && joined && <div>Link referral: <br/><b>{config.appUrl}/?ref={myUid}</b></div> }
            </Box> }
            <Divider style={{marginTop: 16,marginBottom: 16}} />
            <Box className={classes.box} >
                <h3>Your Balance</h3>
                {supportedTokens.map((token, index) => {
                        return (
                            <div key={`your-balance-${index}`} className={classes.tabContent}>
                                <WalletBalance token={supportedTokens[index]} />
                            </div>
                        )
                })}
                <h3>Referral Contract Balance</h3>
                {supportedTokens.map((token, index) => {
                        return (
                            <div key={`contract-balance-${index}`} className={classes.tabContent}>
                                <ContractBalance token={supportedTokens[index]} account={config["97"]["referral_contract"]} />
                            </div>
                        )
                })}
            </Box>
            <Divider style={{marginTop: 16,marginBottom: 16}} />
            <Card sx={{ minWidth: 275 }}>
                <CardContent>
                <Typography align="left" variant="h5" component="div">
                RADA Investment Program {bull} RIR Token #{program1.code}
                </Typography>
                <Typography align="left" component="div">
                Status: {Object.keys(program1).length >0  && program1.paused ? 'Stopped':'Running'}
                </Typography>
                <List dense={true}>
                    <ListItem>
                        <ListItemText
                            primary="Incentive level 1"
                            secondary={Object.keys(program1).length >0 && formatUnits(program1.incentiveL0, 18)}
                        />
                        <ListItemText
                        primary="Incentive level 2"
                        secondary={Object.keys(program1).length >0 && formatUnits(program1.incentiveL1, 18)}
                        />
                        <ListItemText
                            primary="Incentive level 3"
                            secondary={Object.keys(program1).length >0 && formatUnits(program1.incentiveL2, 18)}
                        />
                    </ListItem>
                </List>
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
                MEO IDO Program {bull} MEO Token #{program2.code}
                </Typography>
                <Typography align="left" component="div">
                Status: {Object.keys(program2).length >0 && program2.paused ? 'Stopped':'Running'}
                </Typography>
                <List dense={true}>
                    <ListItem>
                        <ListItemText
                            primary="Incentive level 1"
                            secondary={Object.keys(program2).length >0 && formatUnits(program2.incentiveL0, 18)}
                        />
                        <ListItemText
                        primary="Incentive level 2"
                        secondary={Object.keys(program2).length >0 && formatUnits(program2.incentiveL1, 18)}
                    />
                    <ListItemText
                        primary="Incentive level 3"
                        secondary={Object.keys(program2).length >0 && formatUnits(program2.incentiveL2, 18)}
                    />
                    </ListItem>
                </List>
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
                RADA Investment Program version II {bull} RIR Token #{program3.code}
                </Typography>
                <Typography align="left" component="div">
                Status: {program3 && program3.paused ? 'Stopped':'Running'}
                </Typography>
                <List dense={true}>
                    <ListItem>
                        <ListItemText
                            primary="Incentive level 1"
                            secondary={Object.keys(program3).length >0 && formatUnits(program3.incentiveL0, 18)}
                        />
                        <ListItemText
                        primary="Incentive level 2"
                        secondary={Object.keys(program3).length >0 && formatUnits(program3.incentiveL1, 18)}
                    />
                    <ListItemText
                        primary="Incentive level 3"
                        secondary={Object.keys(program3).length >0 && formatUnits(program3.incentiveL2, 18)}
                    />
                    </ListItem>
                </List>
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





