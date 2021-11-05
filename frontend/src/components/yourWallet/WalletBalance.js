// import { Token } from "../Main"
import { useEthers, useTokenBalance } from "@usedapp/core"
import { formatUnits } from "@ethersproject/units"
import { BalanceMsg } from "../../components/BalanceMsg"


export const WalletBalance = ({ token }) => {
    const { image, address, name } = token
    const { account } = useEthers()
    const tokenBalance = useTokenBalance(address, account)
    const formattedTokenBalance = tokenBalance ? (formatUnits(tokenBalance, 18)) : 0
    return (<BalanceMsg
        label={`${name} balance`}
        tokenImgSrc={image}
        amount={formattedTokenBalance} />)
}