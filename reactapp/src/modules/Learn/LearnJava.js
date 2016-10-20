import React from 'react'
import { Button, Navbar, Nav, NavItem,Modal,Checkbox,FormGroup,ControlLabel,FormControl  } from 'react-bootstrap';
import { browserHistory, Router, Route, Link } from 'react-router'
import { LinkContainer} from 'react-router-bootstrap'

const wellStyles = {maxWidth: 400, margin: '0 auto 10px'};

const Learn = React.createClass({
	getInitialState: function(){
		return { show: false };
	},
	render: function(){
		let close = () => this.setState({ show: false});
		
		return (
			<div>
				  <div className="well" style={wellStyles}>
				    <Button bsStyle="primary" bsSize="large" block
			          onClick={() => this.setState({ show: true})}>
		               I want to learn Java
		            </Button>
				  </div>
				  
				  <div className="modal-container" style={{height: 200}}>
			        <Modal
			          show={this.state.show}
			          onHide={close}
			          container={this}
			          aria-labelledby="contained-modal-title"
			        >
			          <Modal.Header closeButton>
			            <Modal.Title id="contained-modal-title">Tell us about yourself</Modal.Title>
			          </Modal.Header>
			          <Modal.Body>
				            <Checkbox>
				          		I know nothing about programming 
				          	</Checkbox>
							<Checkbox> 
								I know a little about programming
							</Checkbox>
								<Checkbox> 
								I know a C/C++
							</Checkbox>
			          </Modal.Body>
			          <Modal.Footer>
			            <LinkContainer to="/articles/java" > 
			            	<Button onClick={close}>Proceed</Button>
			            </LinkContainer>
			          </Modal.Footer>
			        </Modal>
			      </div>
		        
			      {this.props.children}
			  </div>
			)
	}
})

exports.Learn = Learn