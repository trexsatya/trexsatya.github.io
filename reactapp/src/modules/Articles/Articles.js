import React from 'react'
import { Link } from 'react-router'
import $ from 'jquery'; 
import {getLoader} from '../Utils'

var Articles = React.createClass({
	getInitialState: function(){
		return { articles: [], showLoader: true }
	},
	url: function(){
		return "https://weblog-satya.herokuapp.com/articles/"+this.props.params.subject
	},
	componentDidMount: function() {
		this._showLoading = getLoader('loadingCanvas')
		window.setInterval(this._showLoading, 100)
		
		var me = this
	    this.serverRequest = $.get(this.url(), function (result) {
	      var articles = result;
	      this.setState({
	    	  articles: articles
	      });
	      
	    }.bind(this))
	    .always(function(){
	    	me.setState({
		    	  showLoader: false
		    });
	    	window.clearInterval(me._showLoading)
		    me._showLoading = 0
	    })
	    
	  },
	 
	  componentWillUnmount: function() {
	    this.serverRequest.abort();
	    this._showLoading = null
	    window.clearInterval(this._showLoading)
	  },

	  render: function(){
		  return (
			<div>
					{this.state.showLoader ? <canvas className="ajax-loader" id="loadingCanvas" width="300" height="300"></canvas> : null}
					{this.state.articles.map(article => (
		              <li key={article.id}><Link to={`/article/${article.id}`}>{article.name}</Link></li>
		            ))}
			</div>
		  )
	  }
})

exports.Articles = Articles