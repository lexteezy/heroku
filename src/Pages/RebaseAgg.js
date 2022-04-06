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
			"0x6CFf95758cBB781Bd767490a21BA998304febF07",
			reactAbi,
			avaxProvider
		);

		this.state = {
			reactContract: reactContract,
			signerAddress: "",
			signerBalance: 0,
			tokenDecimal: 18,
			totalRewardsDistributed: 0,
            userRealizedGains: 0,
            pendingRewards: 0,
		};
	}

	tokenFormatEther(value) {
		return ethers.utils.formatUnits(value, this.state.tokenDecimal);
	}

	connectWallet = async () => {
		const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
		await provider.send("eth_requestAccounts", []);
		let signer = await provider.getSigner();
		if (!this.state.signerAddress) {
			signer.signMessage("Connect Wallet to OTO");
		}
		let signerAddress = signer.getAddress();
		let signerBalance = this.getAccountBalance(signerAddress);
		this.setState({ signerAddress: signerAddress });
		this.setState({ signerBalance: signerBalance });
		//HIDE Connect wallet button once signerAddy has value
	};

    //usable for other addy not just signer
	async getAccountBalance(address) {
		if (!address) {
			return;
		}
		const balance = await this.state.reactContract.balanceOf(address);
		return this.tokenFormatEther(balance);
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

    async procMetamask() {
		const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
		await provider.send("eth_requestAccounts", []);
		return await provider.getSigner();
    }
    //assign to button
    async claimPendingRewards() {
		let signer = this.procMetamask();
		signer.signMessage("Claim Pending Rewards!");
        await this.state.reactContract.claimPendingRewards();
    }
    //assign to button
    async compoundDividends() {
		let signer = this.procMetamask();
		signer.signMessage("Compound Dividend!");
        await this.state.reactContract.compoundDividends();
    }

    async lockTokens(amount, days) {
        const daysInSeconds = days * 86400; //86400 seconds per day
        let signer = this.procMetamask();
		signer.signMessage("Lock Tokens");
        await this.state.reactContract.lockInitialTokens(amount, daysInSeconds);
    }
    


}
