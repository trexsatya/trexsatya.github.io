import React from 'react'
import AlloyEditor from 'alloyeditor';
import { Button } from 'react-bootstrap';
import _ from 'underscore'

const Editor = React.createClass({
    componentDidMount: function() {
    	if(!this.isLoggedIn()) return
    	var config = this.props.alloyEditorConfig || {}
    	config.toolbars = {
		    add: {
		        buttons: ['table', 'hline', 'image', 'pbckcode'],
		        tabIndex: 2
		    },
		    styles: {
		        selections: [{
			            name: 'link',
			            buttons: ['linkEdit'],
			            test: AlloyEditor.SelectionTest.link
			        }, {
			            name: 'image',
			            buttons: ['imageLeft', 'imageRight'],
			            test: AlloyEditor.SelectionTest.image
			        }, {
			            name: 'text',
			            buttons: ['styles', 'bold', 'italic', 'underline', 'link','Font', 'FontSize', 'TextColor', 'BGColor'],
			            test: AlloyEditor.SelectionTest.text
			        }, {
			            name: 'table',
			            buttons: ['tableRow', 'tableColumn', 'tableCell', 'tableRemove'],
			            getArrowBoxClasses: AlloyEditor.SelectionGetArrowBoxClasses.table,
			            setPosition: AlloyEditor.SelectionSetPosition.table,
			            test: AlloyEditor.SelectionTest.table
		        }],
		        tabIndex: 1
		    }
    	};
    	
    	config.extraPlugins = AlloyEditor.Core.ATTRS.extraPlugins.value + ',ae_buttonbridge,ae_panelmenubuttonbridge,ae_richcombobridge,font,panelbutton,colorbutton,floatpanel,pbckcode'
        this._editor = AlloyEditor.editable(this.props.container , config);
    },
    isLoggedIn: function(){
		  window.weblogsatya = window.weblogsatya || {}
		  return (window.weblogsatya.u == 'satya' && window.weblogsatya.p == 'satya')
	},
    saveArticle: function(){
    	if(this.props.onSave){
    		this.props.onSave(this.getContent())
    		return
    	}
    	console.log(this.getContent())
    },
    initialContent: function(){
    	return { __html: this.props.content }
    },
    getView: function(){
    	return (
            	<div > 
    	        	{!this.props.id ? 
    	        		<div className="article-header"> 
    	        			<Button className="glyphicon glyphicon glyphicon-floppy-disk"  onClick={this.saveArticle} >Save</Button> 
    	        		</div> : 
    	        			null
    	        	}	
    	            <div id={this.props.container} dangerouslySetInnerHTML={this.initialContent()} />
            	</div>	
              )
    },
    componentWillUnmount: function() {
        if(this._editor) this._editor.destroy();
    },

    getContent: function(){
    	return this._editor.get('nativeEditor').getData();
    },
    getNullView: function(){
    	return (<div> You are not logged in.</div>)
    },
    render: function() {
        return this.isLoggedIn() ? this.getView() : this.getNullView()
    }
});

exports.Editor = Editor