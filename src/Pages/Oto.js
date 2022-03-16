import saforkAbi from '../ABI/saforkAbi.json';
import wavaxAbi from "../wavaxAbi.json"
import { useState, useEffect } from 'react';
import Axios from 'axios';
import { ethers } from 'ethers';

//http://localhost:3000/oto
/* TODO: NEED TO FIX SOME RACE CONDITIONS BETWEEN PROMISES TO ACHIEVE EXPECTED/CONSISTENT OUTPUTS */
function Oto() {

    const [tokenPrice, setTokenPrice] = useState(0);
    const [tokenDecimal, setTokenDecimal] = useState(5);
    const [tokenSupply, setTokenSupply] = useState({
        totalSupply: 0,
        circulatingSupply: 0,
        firepitPercentage: 0
    });
    const [taxReceiverBalances, setTaxReceiverBalances] = useState({
        treasury: 0,
        insurance: 0,
        firepit: 0
    });
    const [taxesInUsd, setTaxesInUsd] = useState({
        treasury: 0,
        insurance: 0,
        firepit: 0
    });
    const [count, setCount] = useState(0);

    const avaxProvider = new ethers.providers.getDefaultProvider("https://api.avax.network/ext/bc/C/rpc");

    const firepitAddress = "0x4DaDa77b4497718b0D543CdC0434b6aFb651842F"; //REPLACE WITH ACTUAL TOKEN FIREPIT CA
    const treasuryAddress = "0x7d1516e604C53627Ea8596D09e71BFe3239A4461"; //REPLACE WITH ACTUAL TOKEN TREASURY CA
    const insuranceAddress = "0x4336383Dbd4099D7F7bB31A02308ADbfFe5B74F1"; //REPLACE WITH ACTUAL TOKEN INSURANCE CA

    const lpPair = "0xe2E8289f1F1Bc395116f2b50d59F41cF2Cda9b4f"; //REPLACE WITH ACTUAL OTO's LP PAIR CA

    let tokenContract;
    let wavaxContract;
    let avaxPrice;

    useEffect(() => {
        Axios.get("https://api.coinstats.app/public/v1/coins/avalanche-2").then(
          (response) => {
            avaxPrice = response.data.coin.price;
          }
        );
        wavaxContract = new ethers.Contract(
            "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
            wavaxAbi,
            avaxProvider
        );
        tokenContract = new ethers.Contract(
            "0xb0c20a934c9dc89bdf1280fde0f3122c2ebb0fb9", //REPLACE WITH OTO's CA
            saforkAbi,
            avaxProvider
        );

        getTokenDecimals();
        getTokenPrice();
        setTimeout(() => "", 5000);
        getTaxReceiverBalances();
        getTotalSupply();
    }, [wavaxContract, tokenContract, avaxPrice]);

    const getTokenDecimals = async() => {
        console.log('getTokenDecimals');
        const tokenDecimal = await tokenContract._decimals();
        setTokenDecimal(tokenDecimal);
    }

    const getTotalSupply = async() => {
        console.log('getTotalSupply');
        const totalSupply = ethers.utils.formatUnits(await tokenContract._totalSupply(), 5);
        const firepitSupply = ethers.utils.formatUnits(await tokenContract.balanceOf(firepitAddress), tokenDecimal);
        console.log('firepitSupply', firepitSupply);
        const firepitPercentage = ((firepitSupply / totalSupply) * 100).toFixed(2);
        setTokenSupply({
            totalSupply: totalSupply,
            circulatingSupply: totalSupply - firepitSupply,
            firepitPercentage: firepitPercentage
        });
    }

    const getTaxReceiverBalances = async() => {
        console.log('getTaxReceiverBalances');
        const firepitBalance =   ethers.utils.formatUnits(await tokenContract.balanceOf(firepitAddress), tokenDecimal);
        const treasuryBalance =   ethers.utils.formatUnits(await tokenContract.balanceOf(treasuryAddress), tokenDecimal);
        const insuranceBalance =   ethers.utils.formatUnits(await tokenContract.balanceOf(insuranceAddress), tokenDecimal);
        setTimeout(() => "", 5000);
        //NEED TO FIX RACE CONDITION ^^^^^^^^ 
        let firepitInUsd;
        if(firepitBalance) {
            console.log('firepitBalance', firepitBalance);
            firepitInUsd = await getTokenInUsd(firepitAddress);
        }
        const treasuryInUsd = await getTokenInUsd(treasuryAddress);
        const insuranceInUsd = await getTokenInUsd(insuranceAddress);

        setTaxReceiverBalances({
            firepit: firepitBalance,
            treasury: treasuryBalance,
            insurance: insuranceBalance
        });
        setTaxesInUsd({
            firepit: firepitInUsd,
            treasury: treasuryInUsd,
            insurance: insuranceInUsd
        });
    }
    
    const getTokenInUsd = async(address) => {
        console.log('getTokenInUsd');
        const tokenBalance = ethers.utils.formatUnits(await tokenContract.balanceOf(address), tokenDecimal);
        setTimeout(() => "",  5000);
        const tokenInUsd = tokenBalance * tokenPrice;
        return tokenInUsd;
    }
      
    //GET TOKEN PRICE WITHOUT COINGECKO/CMC ONLY BASED ON LIQUIDITY PAIR
    const getTokenPrice = async() => {
      console.log('getTokenPrice');
      const avaxBalance = ethers.utils.formatUnits(await wavaxContract.balanceOf(lpPair), 18);
      const tokenBalance = ethers.utils.formatUnits(await tokenContract.balanceOf(lpPair), tokenDecimal);
      const avaxBalanceInUsd = avaxBalance * avaxPrice;
      const tPrice = (avaxBalanceInUsd / tokenBalance).toFixed(5);
      setTokenPrice(tPrice);
    }

    return (
        <div className="Oto">
            <header className="App-header">
                Hello World
                <table>
                    <thead>
                        <tr aria-colspan={2}></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>TokenPrice</td>
                            <td>{tokenPrice}</td>
                        </tr>
                        <tr>
                            <td>TotalSupply</td>
                            <td>{tokenSupply.totalSupply}</td>
                        </tr>
                        <tr>
                            <td>CirculatingSupply</td>
                            <td>{tokenSupply.circulatingSupply}</td>
                        </tr>
                        <tr>
                            <td>Treasury</td>
                            <td>{taxReceiverBalances.treasury}</td>
                        </tr>
                        <tr>
                            <td>Treasury IN USD</td>
                            <td>{taxesInUsd.treasury}</td>
                        </tr>
                        <tr>
                            <td>Insurance</td>
                            <td>{taxReceiverBalances.insurance}</td>
                        </tr>
                        <tr>
                            <td>Insurance IN USD</td>
                            <td>{taxesInUsd.insurance}</td>
                        </tr>
                        <tr>
                            <td>Firepit</td>
                            <td>{taxReceiverBalances.firepit}</td> 
                        </tr>
                        <tr>
                            <td>Firepit IN USD</td>
                            <td>{taxesInUsd.firepit}</td>
                        </tr>
                        <tr>
                            <td>% FirePit Supply</td>
                            <td>{tokenSupply.firepitPercentage}%</td>
                        </tr>
                    </tbody>
                </table>
                
            </header>
        </div>
    );    
}

export default Oto;