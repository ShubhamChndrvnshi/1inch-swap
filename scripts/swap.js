const { ethers } = require("hardhat");
const { deploy } = require("./deploy");
const { BigNumber } = ethers;
const axios = require("axios");
const fetcher = axios.create({ timeout: 30000 });
const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const SUSHISWAP_ROUTER_ADDRESS = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"; 


async function main() {

    const accounts = await ethers.getSigners();
    const { swapProxyAddress } = await deploy();
    const swap_proxy = await ethers.getContractAt("SwapProxy", swapProxyAddress);
    const token_in = await ethers.getContractAt("IERC20Metadata", USDC_ADDRESS);
    const token_out = await ethers.getContractAt("IERC20Metadata", "0x172370d5cd63279efa6d502dab29171933a610af");
    let balOfTokenAfterSwap;
    const slippage = BigNumber.from("5")
    const chain_id = 137;

    // Get tokens to swap
    const wmatic = await ethers.getContractAt("WMATIC", WMATIC_ADDRESS)
    const sushiswapRouter = await ethers.getContractAt("PancakeRouter", SUSHISWAP_ROUTER_ADDRESS)
    try {
        let amountIn = ethers.utils.parseUnits("9800", "ether")
        console.log("Getting wmatic for matic deposits")
        let uIndex = 15, lIndex = 2;
        for (let i = lIndex; i < uIndex; i++) {
            try {
                await wmatic.connect(accounts[i]).deposit({ value: amountIn })
            } catch { console.log("wmatic deposit fail",i)}

        }
        console.log("Transferring all tokens to account[0]");

        for (let i = lIndex; i < uIndex; i++) {
            try {
                const bal = (await wmatic.balanceOf(accounts[i].address)).toString();
                console.log(`account[${i}] balance: ${bal}`);
                await wmatic.connect(accounts[i]).transfer(accounts[0].address, bal);
            } catch { console.log("wmatic transfer fail",i)}
        }
        const balWmatic = (await wmatic.balanceOf(accounts[0].address)).toString();

        console.log("Account balance wmatic: ", balWmatic)
        await wmatic.approve(SUSHISWAP_ROUTER_ADDRESS, balWmatic);
        const amountsOut = await sushiswapRouter.getAmountsOut(balWmatic, [WMATIC_ADDRESS, token_in.address]);
        console.log("amountsOut", amountsOut)
        const amountOutMin = BigNumber.from(0); // amountOutMin: we can skip computing this number because the math is tested

        console.log(`Swapping WMATIC for ${await token_in.symbol()}`);

        amountIn = await wmatic.balanceOf(accounts[0].address)
        console.log("amountIn", ethers.utils.formatEther(amountIn).toString())
        await sushiswapRouter.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            [WMATIC_ADDRESS, token_in.address],
            accounts[0].address,
            Math.floor((Date.now() / 1000)) + 60 * 10
        );

        balOfTokenAfterSwap = await token_in.balanceOf(accounts[0].address);
        console.log(`${await token_in.symbol()} Balance: ${BigNumber.from(balOfTokenAfterSwap).div(await token_in.decimals())}`)

    } catch (e) {
        balOfTokenAfterSwap = await token_in.balanceOf(accounts[0].address);
        console.log("Swapping ETH for ERC20 Tokens threw", e);
    }


    const swapReq = `https://api.1inch.exchange/v3.0/${chain_id}/swap?fromTokenAddress=${token_in.address}&toTokenAddress=${token_out.address}&amount=${balOfTokenAfterSwap.toString()}&fromAddress=${swapProxyAddress}&slippage=${slippage.toString()}&destReceiver=${accounts[0].address}&disableEstimate=true`
    const swap_req = await fetcher.get(swapReq);
    const swap_data = swap_req['data']['tx']['data'];
    // console.log("swap_req", swap_req.data)
    const min_out = BigNumber.from(swap_req['data']['toTokenAmount'])
        .mul(BigNumber.from("100").sub(slippage))
        .div(BigNumber.from(100));

    await token_in.approve(swapProxyAddress, balOfTokenAfterSwap);
    console.log(`
    Before token swap
    token_in balance: ${(await token_in.balanceOf(accounts[0].address)).toString()}
    token_out balance: ${(await token_out.balanceOf(accounts[0].address)).toString()}`);

    await swap_proxy.swap(min_out, swap_data);

    console.log(`
    After token swap
    token_in balance: ${(await token_in.balanceOf(accounts[0].address)).toString()}
    token_out balance: ${(await token_out.balanceOf(accounts[0].address)).toString()}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });