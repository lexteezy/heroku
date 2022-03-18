import React from "react";

const CardDetail = (props) => {
	if(props.children) {
		return ( 
			<div className="card">
				<div className="content">
					{props.children}
					<div className="meta">
						{props.result}
					</div>
				</div>
			</div>
		);
	}
	return (
		<div className="card">
			<div className="content">
				<div className="header">{props.header}</div>
				<div className="meta">{props.meta}</div>
				<div className="description">{props.desc}</div>
			</div>
		</div>
	);
};

export default CardDetail;
