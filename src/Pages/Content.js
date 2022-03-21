import React from "react";
import sample from "../sample.css";
import content from "../content.css";
// import seriously from "../seriously.png";

const Content = () => {
	return (
		<div>
			<div className="background-dark">
				<div className="d-none d-lg-block">
					<div className="row">
						<div className="col-sm-12 col-md-6 container-padding">
							<div className="pb-5">
								<span className="header">Hello World</span>
							</div>
							<div className="pb-5">
								<span className="description">Description</span>
							</div>
							<div>
								<button type="button" className="btn btn-warning custom-btn">
									View Resume
								</button>
							</div>
						</div>
						<div className="col-sm-12 col-md-6 imageright">
							<img
								className="profile"
								src={`${process.env.PUBLIC_URL}/logo512.png`}
								alt=""
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Content;
