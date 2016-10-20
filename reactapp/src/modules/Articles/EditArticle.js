import { Editor } from '../Editor/Editor'
import React from 'react'
import { render } from 'react-dom'
import { Button, Navbar, Nav, NavItem,Modal,Checkbox,FormGroup,ControlLabel,FormControl  } from 'react-bootstrap';
import { browserHistory, Router, Route, Link } from 'react-router'
import { LinkContainer} from 'react-router-bootstrap'
import $ from 'jquery'; 

const createArticleModal = function(content){
	const TitleModal = React.createClass({
		getInitialState: function(){
			return { show: true }
		},
		postArticle: function(){
			var title = document.getElementById('articleTitleTextInput').value
			var subject = document.getElementById('articleSubjectTextInput').value
			var tags = document.getElementById('articleTagsTextInput').value.split(",")
			
			if(!title || !subject ){
				return;
			}
			postArticleToAPI({
				name: title,
				content: content,
				subject: subject,
				tags: tags
			});
			this.setState({ show: false })
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
					      <Modal.Title id="contained-modal-title">Enter the title for article.</Modal.Title>
					    </Modal.Header>
					    <Modal.Body>
					       <form>
						       <FormGroup controlId="articleTitleTextInput">
						         <FormControl type="text" placeholder="Title" />
						       </FormGroup>
						       <FormGroup controlId="articleSubjectTextInput">
						         <FormControl type="text" placeholder="Subject" />
						       </FormGroup>
						       <FormGroup controlId="articleTagsTextInput">
						         <FormControl type="text" placeholder="Tags (comma separated)" />
						       </FormGroup>
						       <Button onClick={this.postArticle}>Submit</Button>
					       </form>
					    </Modal.Body>
				  </Modal>
			 )
		}	
		
	})
	return <TitleModal />
}

const postArticleToAPI = function(article){
	let url = "https://weblog-satya.herokuapp.com/article"
	console.log(article)	
	window.weblogsatya = window.weblogsatya || {}
	
	$.ajax({
	      url: url,
	      dataType: 'json',
	      type: 'PUT',
	      contentType: 'application/json',
	      data: JSON.stringify(article),
	      beforeSend: function(xhr){
	    	  xhr.setRequestHeader('X-Auth', window.weblogsatya.u + window.weblogsatya.p ); 
	      },
	      error: function(xhr, status, err) {
	        console.error(url, status, err.toString());
	      }.bind(this)
	})
	.done(function(data){
    	  console.log("success");
    	  browserHistory.push('/article/'+data.id)
	})
}


const createArticle = function(data){
	let url = "https://weblog-satya.herokuapp.com/article"
	console.log('saving new article.')
	render( createArticleModal(data), document.getElementById('modal-holder'))
}

const ArticleEditor = ({children})=> (
	<div id="article-editor">
	  <Editor container="editable" onSave={createArticle}/>
      <div id="modal-holder"/>
	</div>
)

exports.ArticleEditor = ArticleEditor 