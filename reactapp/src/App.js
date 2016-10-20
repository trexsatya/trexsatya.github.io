import React from 'react'
import { render } from 'react-dom'
import { Button, Navbar, Nav, NavItem,Modal,Checkbox,FormGroup,ControlLabel,FormControl  } from 'react-bootstrap';
import { browserHistory, Router, Route, Link } from 'react-router'
import { LinkContainer} from 'react-router-bootstrap'
import { LearnJava } from './modules/Learn/LearnJava'
import { Articles } from './modules/Articles/Articles'
import { ArticleEditor } from './modules/Articles/EditArticle'
import { ArticleDetail } from './modules/Articles/ArticleDetail'
import { Learn } from './modules/Learn/LearnJava'
import $ from 'jquery'; 
import {createLoginPanel} from './modules/Account/Login'
import {showLoginPanel} from './modules/Account/Login'
import { Provider } from 'react-redux';
import { createStore } from 'redux'
import { appStore } from './reducers'



const NavBar = () => (
		<Navbar inverse>
            <Navbar.Header>
              <Navbar.Brand>
                <Link to="/">Weblog-Satya</Link>
              </Navbar.Brand>
              <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
              <Nav>
                <LinkContainer to="/learn" >
                  <NavItem eventKey={1} >Learn</NavItem>
                </LinkContainer>
              </Nav>
              <Nav pullRight>
                <LinkContainer to="/editor" >
                    <NavItem eventKey={1} href="#">Editor</NavItem>
                </LinkContainer>
              </Nav>
              <Nav pullRight>
                    <NavItem eventKey={1} href="#" onClick={showLoginPanel}>Login </NavItem>
              </Nav>
            </Navbar.Collapse>
	  </Navbar>
)	  

const mainContentStyle = {
		marginLeft: '7%'
}

const App = ({ children }) => 
(
  <div>
      <NavBar />
      <div id="modal-holder"/>
      <div style={mainContentStyle}>
      	{children}
      </div>
  </div>
)

let store = createStore(appStore)

render(
(
 <Provider store={store}>
	 <Router history={browserHistory}>
		 <Route path="/" component={App}>
		   <Route path="learn" component={Learn} />
		   <Route path="learn/java" component={LearnJava}>
		   </Route>
		   <Route path="/articles/:subject" component={Articles} />
		   <Route path="/article/:id" component={ArticleDetail} />
		   <Route path="/editor" component={ArticleEditor} />
		 </Route>
     </Router>
 </Provider>
  
), document.getElementById('root'))
