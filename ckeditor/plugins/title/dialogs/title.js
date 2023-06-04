CKEDITOR.dialog.add( 'titleDialog', function ( editor ) {

    return {
        title: 'Add Title Popup',
        minWidth: 400,
        minHeight: 200,

        contents: [
            {
                    id: 'tab-basic-title',
                    label: 'Title Text',
                    elements: [
                        {
                            type: 'textarea',
                            id: 'titleTextarea',
                            label: 'Text',
                            validate: CKEDITOR.dialog.validate.notEmpty( "Cannot be empty." ),
                            required: true
                        },
                        {
                            type: 'select',
                            id: 'titleContainerType',
                            label: 'Container Type',
                            items: [ ['span' , 'span'], ['div' , 'div']],
                            default: 'span'
                        }
                    ]
             }
        ],
        onLoad: function(){

        },
        onShow: function(){
            var dialog = this;
            var editing = editor;

            var existing = editing.getSelection().getStartElement();
            if(existing.hasAttribute('title')){
                dialog.setValueOf( 'tab-basic-title', 'titleContainerType',  existing.getName())
                dialog.setValueOf( 'tab-basic-title', 'titleTextarea', existing.getHtml() )
            }
        },

        onOk: function() {
                var dialog = this;
                var mattext = dialog.getValueOf( 'tab-basic-title', 'titleTextarea' )
                var mathContainerType = dialog.getValueOf( 'tab-basic-title', 'titleContainerType' )

                var existing = editor.getSelection().getStartElement();
                if(existing.hasAttribute('title')){
                    existing.setAttribute('title', mattext)
                } else {
                    var insertingElement = mathContainerType === 'span' ? editor.document.createElement('span')
                                                                   : editor.document.createElement('div');

                    insertingElement.setAttribute('title', mattext)
                    editor.insertElement( insertingElement );
                }

        }
    };
});
