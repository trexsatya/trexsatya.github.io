import  React  from 'react'
import { render } from 'react-dom'
import { Button, Navbar, Nav, NavItem,Modal,Checkbox,FormGroup,ControlLabel,FormControl  } from 'react-bootstrap';
import { LinkContainer} from 'react-router-bootstrap'

var LoginPanel = React.createClass({
	getInitialState: function(){
		return { show: true };
	},
	close: function(){
		this.setState({ show: false })
	},
	render: function(){
		return (<Modal
			    onHide={this.close}
				backdrop="static"
				show= {this.state.show}
			    aria-labelledby="contained-modal-title">
				    <Modal.Header closeButton>
				      <Modal.Title id="contained-modal-title">Login</Modal.Title>
				    </Modal.Header>
				    <Modal.Body>
				       <form>
					       <FormGroup controlId="loginUsernameTextInput">
					         <FormControl type="text" placeholder="Username" />
					       </FormGroup>
					       <FormGroup controlId="loginPasswordTextInput">
					         <FormControl type="password" placeholder="Password" />
					       </FormGroup>
					       <Button onClick={this.postArticle}>Login</Button>
				       </form>
				    </Modal.Body>
			  </Modal>
		 )
	 }	
});

function createLoginPanel(){
	var LoginPanel = React.createClass({
		getInitialState: function(){
			return { show: true };
		},
		close: function(){
			this.setState({ show: false })
		},
		render: function(){
			return (<Modal
				    onHide={this.close}
					backdrop="static"
					show= {this.state.show}
				    aria-labelledby="contained-modal-title">
					    <Modal.Header closeButton>
					      <Modal.Title id="contained-modal-title">Login</Modal.Title>
					    </Modal.Header>
					    <Modal.Body>
					       <form>
						       <FormGroup controlId="loginUsernameTextInput">
						         <FormControl type="text" placeholder="Username" />
						       </FormGroup>
						       <FormGroup controlId="loginPasswordTextInput">
						         <FormControl type="password" placeholder="Password" />
						       </FormGroup>
						       <Button onClick={this.postArticle}>Login</Button>
					       </form>
					    </Modal.Body>
				  </Modal>
			 )
		 }	
	});
	return <LoginPanel/>
};

exports.createLoginPanel = createLoginPanel

exports.showLoginPanel = function(){
	console.log("showLoginPanel")
	
	render(createLoginPanel(), document.getElementById('modal-holder'))
}