CKEDITOR.dialog.add( 'mathematicaDialog', function ( editor ) {
    return {
        title: 'Abbreviation Properties',
        minWidth: 400,
        minHeight: 200,

        contents: [
            {
                    id: 'tab-basic',
                    label: 'Mathematical Text',
                    elements: [
                        {
                            type: 'textarea',
                            id: 'mats',
                            label: 'Maths',
                            validate: CKEDITOR.dialog.validate.notEmpty( "Cannot be empty." )
                        }
                    ]
             }
        ],

        onOk: function() {
                var dialog = this;
                var mattext = dialog.getValueOf( 'tab-basic', 'mats' )
                var canvas = editor.document.createElement('canvas')

                var ctx = canvas.$.getContext("2d");

                var data = null
                try { data = JSON.parse(mattext) } catch(e){}

                if(data) {
                    canvas.setAttribute('data-type', "maths")
                    canvas.setAttribute('data', mattext)
                }

                editor.insertElement( canvas );

        }
    };
});