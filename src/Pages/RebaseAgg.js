import React from "react";
import reactAbi from "../rebaseAggregatorAbi.json";
import { ethers } from "ethers";
import Axios from "axios";
import wavaxAbi from "../wavaxAbi.json";
import defaultErc20Abi from "../ABI/defaultErc20Abi.json";

class RebaseAgg extends React.Component {
	constructor(props) {
		super(props);

		const avaxProvider = new ethers.providers.getDefaultProvider(
			"https://api.avax.network/ext/bc/C/rpc"
		);

		const bscProvider = new ethers.providers.getDefaultProvider(
			"https://bsc-dataseed3.ninicoin.io/"
		);

		const maticProvider = new ethers.providers.getDefaultProvider(
			"https://matic-mainnet.chainstacklabs.com/"
		);

		const safuuContract = new ethers.Contract(
			"0xE5bA47fD94CB645ba4119222e34fB33F59C7CD90",
			defaultErc20Abi,
			bscProvider
		);

		const titanoContract = new ethers.Contract(
			"0xBA96731324dE188ebC1eD87ca74544dDEbC07D7f",
			defaultErc20Abi,
			bscProvider
		);

		const sphereContract = new ethers.Contract(
			"0x8D546026012bF75073d8A586f24A5d5ff75b9716",
			defaultErc20Abi,
			maticProvider
		);

		const reactContract = new ethers.Contract(
			"0xd33df97747dD6bEcAD26B2e61F818c94B7588E69",
			reactAbi,
			avaxProvider
		);
		const wavaxContract = new ethers.Contract(
			"0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
			wavaxAbi,
			avaxProvider
		);
		
		const lpPair = "0x580436ecaba01815711aa4a191c4405c73ddf829";

		this.state = {
			reactContract: reactContract,
			wavaxContract: wavaxContract,
			safuuContract,
			sphereContract,
			titanoContract,
			rebaseTreasuryAddy: "0xcFc2cd0A95b1c6aA1CBd3c296e53007Eabd36CBC",
			signer: null,
			signerAddress: "",
			signerBalance: 0,
			tokenDecimal: 18,
			safuuDecimal: 5,
			titanoDecimal: 18,
			sphereDecimal: 18,
			totalRewardsDistributed: 0,
            userRealizedGains: 0,
            pendingRewards: 0,
			lpBalance: {
				avax: 0,
				token: 0
			},
			lpPair: lpPair,
			avaxPrice: 0,
			circulatingMarketCap: 0,
			reactPrice: 0,
			totalSupply: 0, 
			marketCap: 0,
			sphereBalance: 0,
			safuuBalance: 0,
			titanoBalance: 0,
			spherePrice: 0,
			safuuPrice: 0,
			titanoPrice: 0
		};
	}

	componentDidMount() {
		await Axios.get(
			"https://api.coinstats.app/public/v1/coins/avalanche-2"
		).then((response) => {
			this.setState({ avaxPrice: response.data.coin.price });
		});
		let one = "https://api.coingecko.com/api/v3/simple/price?ids=sphere-finance&vs_currencies=USD";
		let two = "https://api.coingecko.com/api/v3/simple/price?ids=titano&vs_currencies=USD";
		let three = "https://api.coingecko.com/api/v3/simple/price?ids=safuu&vs_currencies=USD";

		const reqOne= Axios.get(one);
		const reqTwo= Axios.get(two);
		const reqThree= Axios.get(three);
		Axios.all([reqOne,reqTwo,reqThree]).then((...responses) => {
			console.log('responses',responses[0]);
			const respOne = responses[0][0];
			const respTwo = responses[0][1];
			const respThree = responses[0][2];
			
			const spherePrice = respOne.data['sphere-finance'].usd;
			const titanoPrice = respTwo.data.titano.usd;
			const safuuPrice = respThree.data.safuu.usd;
			
			this.setState({ spherePrice: spherePrice });
			this.setState({ safuuPrice: titanoPrice });
			this.setState({ titanoPrice: safuuPrice });
		});
	}

	tokenFormatEther(value) {
		return ethers.utils.formatUnits(value, this.state.tokenDecimal);
	}

	tokenFormatEther(value, decimal) {
		return ethers.utils.formatUnits(value, decimal);
	}

	connectWallet = async () => {
		const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
		await provider.send("eth_requestAccounts", []);
		let signer = await provider.getSigner();
		if (!this.state.signerAddress) {
			signer.signMessage("Connect Wallet to React");
		}
		let signerAddress = signer.getAddress();
		let signerBalance = this.getAccountBalance(signerAddress);
		this.setState({ signerAddress: signerAddress });
		this.setState({ signerBalance: signerBalance });
		this.setState({ signer: signer});
	};

	async getTreasuryBalance() {
		const sphereBalance = await this.state.sphereContract.balanceOf(this.state.rebaseTreasuryAddy);
		const safuuBalance = await this.state.safuuContract.balanceOf(this.state.rebaseTreasuryAddy);
		const titanoBalance = await this.state.titanoContract.balanceOf(this.state.rebaseTreasuryAddy);

		this.setState({sphereBalance:this.tokenFormatEther(sphereBalance, this.state.sphereDecimal)});
		this.setState({safuuBalance:this.tokenFormatEther(safuuBalance, this.state.safuuDecimal)});
		this.setState({titanoBalance:this.tokenFormatEther(titanoBalance, this.state.titanoDecimal)});
	}

    //usable for other addy not just signer
	async getAccountBalance(address) {
		if (!address) {
			return;
		}
		const balance = await this.state.reactContract.balanceOf(address);
		return this.tokenFormatEther(balance);
	}
	
	async getLPBalance() {
		const avaxBalance = await this.state.wavaxContract.balanceOf(
			this.state.lpPair
		);
		const tokenBalance = await this.state.reactContract.balanceOf(
			this.state.lpPair
		);
		this.setState({
			lpBalance: {
				avax: ethers.utils.formatUnits(avaxBalance, 18),
				token: this.tokenFormatEther(tokenBalance),
			},
		});
	}

	formatEther(value) {
		return ethers.utils.formatUnits(value, 18);
	}

	getTokenPrice() {
		if (
			this.state.lpBalance.avax &&
			this.state.lpBalance.token &&
			this.state.avaxPrice
		) {
			const avaxBalanceInUsd = this.state.lpBalance.avax * this.state.avaxPrice;
			const tokenPrice = (
				avaxBalanceInUsd / this.state.lpBalance.token
			).toFixed(this.state.tokenDecimal);
			this.setState({ reactPrice: tokenPrice });
		} else {
			return 0;
		}
	}

	async getMarketCap() {
		let totalSupply = await this.state.reactContract.totalSupply(); 
		this.state.setState({totalSupply : totalSupply});
		let marketCap = totalSupply * reactPrice;
		this.setState({marketCap: marketCap});
	}


	async getTotalRewardsDistributed() {
		const reward = await this.state.reactContract.getTotalReflected();

		this.setState({ totalRewardsDistributed: reward });
	}

    async getUserRealizedGains(address) {
        const realizeGains = await this.state.reactContract.getUserRealizedGains(address);
        const simplified = this.tokenFormatEther(realizeGains);
        this.setState({ userRealizedGains: simplified});
    }

    async getPendingRewards(address) {
        const unpaidEarnings = await this.state.reactContract.getUserUnpaidEarnings(address);
        const simplified = this.tokenFormatEther(unpaidEarnings);
        this.setState({ pendingRewards: simplified});
    }

	async temporaryClaim() {
		const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
		await provider.send("eth_requestAccounts", []);
		const signer = await provider.getSigner();
		const chainId = await signer.getChainId();
		if(chainId != 43114) {
			//pop up error not in correct network
		} //else continue
		const react = new ethers.Contract(
			"0xd33df97747dD6bEcAD26B2e61F818c94B7588E69",
			reactAbi,
			signer
		);
		await react.claimPendingRewards();
	}

	async temporaryCompound() {
		const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
		await provider.send("eth_requestAccounts", []);
		const signer = await provider.getSigner();
		const chainId = await signer.getChainId();
		if(chainId != 43114) {
			//pop up error not in correct network
		} //else continue
		const react = new ethers.Contract(
			"0xd33df97747dD6bEcAD26B2e61F818c94B7588E69",
			reactAbi,
			signer
		);
		await react.compoundDividends();
	}

    //assign to button
    async claimPendingRewards() {
		this.state.signer.signMessage("Claim Pending Rewards!");
        await this.state.reactContract.claimPendingRewards();
    }
    //assign to button
    async compoundDividends() {
		this.state.signer.signMessage("Compound Dividend!");
        await this.state.reactContract.compoundDividends();
    }

    async lockTokens(amount, days) {
		const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
		await provider.send("eth_requestAccounts", []);
		const signer = await provider.getSigner();
		const chainId = await signer.getChainId();
		if(chainId != 43114) {
			//pop up error not in correct network
		} //else continue
		const react = new ethers.Contract(
			"0xd33df97747dD6bEcAD26B2e61F818c94B7588E69",
			reactAbi,
			signer
		);
        const daysInSeconds = days * 86400; //86400 seconds per day
		signer.signMessage("Lock Tokens");
        await react.lockInitialTokens(amount, daysInSeconds);
    }

    async withdrawTokens(amount, days) {
		const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
		await provider.send("eth_requestAccounts", []);
		const signer = await provider.getSigner();
		const chainId = await signer.getChainId();
		if(chainId != 43114) {
			//pop up error not in correct network
		} //else continue
		const react = new ethers.Contract(
			"0xd33df97747dD6bEcAD26B2e61F818c94B7588E69",
			reactAbi,
			signer
		);
        const daysInSeconds = days * 86400; //86400 seconds per day
		signer.signMessage("Withdraw Tokens");
        await react.withdrawTokens(amount, daysInSeconds);
    }
	

    async getRemainingTokenLockTime(address) {
        const seconds = this.state.reactContract.getRemainingTokenLockTime(address);
        if(seconds > 86400) {
            const daysInSeconds = seconds / 86400;
        }
    }

	async getLockedTokenAmount() {
		this.getLockedTokenAmount(this.state.signerAddress);
	}
	
	async getLockedTokenAmount (address) {
		const lockedTokens = await this.state.reactContract.getLockedTokenAmount(address);
		const formated = this.tokenFormatEther(lockedTokens);
	}
    


}
