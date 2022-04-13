import React from "react";
import reactAbi from "../rebaseAggregatorAbi.json";
import { ethers } from "ethers";
import Axios from "axios";
import wavaxAbi from "../wavaxAbi.json";

class RebaseAgg extends React.Component {
	constructor(props) {
		super(props);

		const avaxProvider = new ethers.providers.getDefaultProvider(
			"https://api.avax.network/ext/bc/C/rpc"
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
			signer: null,
			signerAddress: "",
			signerBalance: 0,
			tokenDecimal: 18,
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
			marketCap: 0

		};
	}

	componentDidMount() {
		await Axios.get(
			"https://api.coinstats.app/public/v1/coins/avalanche-2"
		).then((response) => {
			this.setState({ avaxPrice: response.data.coin.price });
		});
	}

	tokenFormatEther(value) {
		return ethers.utils.formatUnits(value, this.state.tokenDecimal);
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
        const daysInSeconds = days * 86400; //86400 seconds per day
		this.state.signer.signMessage("Lock Tokens");
        await this.state.reactContract.lockInitialTokens(amount, daysInSeconds);
    }

    async getRemainingTokenLockTime(address) {
        const seconds = this.state.reactContract.getRemainingTokenLockTime(address);
        if(seconds > 86400) {
            const daysInSeconds = seconds / 86400;
        }
    }
    


}
