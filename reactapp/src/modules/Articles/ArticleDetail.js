import React from 'react'
import ReactDOM from 'react-dom'
import { Button } from 'react-bootstrap';
import $ from 'jquery'; 
import { Editor } from '../Editor/Editor'
import AlloyEditor from 'alloyeditor';
import {getLoader} from '../Utils'

var ArticleDetail = React.createClass({
	getInitialState: function(){
		return { article: {}, showEditor: false, showLoader: true }
	},
	url: function(){
		return "https://weblog-satya.herokuapp.com/article/"+this.props.params.id
	},
	componentDidMount: function() {
		console.log('ArticleDetail mounted.')
        this._showLoading = getLoader('loadingCanvas')
		window.setInterval(this._showLoading, 100)
		
		var me = this;
		this.serverRequest = $.get(this.url(), function (result) {
	        var article = result;
	        me.setState({
	    	   article: article
	        });
	        me.handleResponse(result)
	    })
	    .fail(function(){
	    	var article = { id: 1, content:"Due to Network error or API error<br/> We are pesenting you a sample content."}
			me.setState({
		    	  article: article
		    })
		    me.handleResponse(article)
	    })
	    .always(function(){
	    	me.setState({
		    	  showLoader: false
		    });
	    	window.clearInterval(me._showLoading)
		    me._showLoading = 0
	    })
	    ;
	  },
	  handleResponse: function(resp){
		  {/* ReactDOM.render(<Controls/>, document.getElementById('article-content-controls')); */}
		  $('#article-content').html(resp.content)
	  },
	  componentWillUnmount: function() {
	    this.serverRequest.abort();
	  },
	  saveArticle: function(data){
		var article = this.state.article
		article.content = data
		this.setState({ showEditor: false, article: article, showLoader: true })
		
		let url = "https://weblog-satya.herokuapp.com/article"
		
		window.setTimeout(function(){
			this._showLoading = getLoader('loadingCanvas')
		    window.setInterval(this._showLoading, 100)
		}.bind(this),0);
		
		window.weblogsatya = window.weblogsatya || {}
		
		$.ajax({
		      url: url,
		      dataType: 'json',
		      type: 'POST',
		      contentType: 'application/json',
		      beforeSend: function(xhr){
		    	  xhr.setRequestHeader('X-Auth', window.weblogsatya.u + window.weblogsatya.p ); 
		      },
		      data: JSON.stringify(article),
		  })
		.done(function(data) {
		       this.setState({article: data});
		       $('#article-content').html(data.content)
		 }.bind(this))
		 .always(function(data){
			 this.setState({
		    	  showLoader: false
		     });
		 }.bind(this))
		      
		
	  },
	  closeEditor: function(){
		  this.setState({ showEditor: false});
	  },
	  openEditor: function(){
		  this.setState({ showEditor: true});
	  },
	  isLoggedIn: function(){
		  window.weblogsatya = window.weblogsatya || {}
		  return (window.weblogsatya.u == 'satya' && window.weblogsatya.p == 'satya')
	  },
	  editButton: function(){
		  return this.isLoggedIn() ? (<div className="article-header">
				  		<span onClick={this.openEditor} className="edit-button-icon">
				  			<span className="glyphicon glyphicon-edit" />
				  			Edit
				  		</span>
				  </div>
		  )  : null
	  },
	  getView: function(){
		  return (
					<div> 
						{!this.state.showEditor ? 
							(
							  <div>
							  	{this.editButton()}
								<div id="article-content" />
							  </div>
							) : null
						}
						{this.state.showLoader ? <canvas className="ajax-loader" id="loadingCanvas" width="300" height="300"></canvas> : null}						
						{this.state.showEditor ? 
							<div>
				    			<Editor container="editable" content={this.state.article.content} onSave={this.saveArticle}/>
							</div>
						: null}
							
					</div>	  
				  )  
	  },
	  render: function(){
		  return this.getView();
	  }
})

exports.ArticleDetail = ArticleDetail