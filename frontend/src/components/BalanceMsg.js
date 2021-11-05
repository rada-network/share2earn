
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
    container: {
        display: "inline-grid",
        gridTemplateColumns: "auto auto auto",
        gap: 16,
        alignItems: "center",
        justifyContent: "start",
        paddingTop: 8
    },
    tokenImg: {
        width: "32px"
    },
    amount: {
        fontWeight: 700,
    },
    labelWidth: {
        width: 150
    },

})

export const BalanceMsg = ({ label, amount, tokenImgSrc }) => {
    const classes = useStyles()

    return (
        <div className={classes.container}>
            <img className={classes.tokenImg} src={tokenImgSrc} alt="token logo" />
            <div className={classes.labelWidth}>{label}</div>
            <div className={classes.amount}>{amount}</div>
        </div>
    )
}