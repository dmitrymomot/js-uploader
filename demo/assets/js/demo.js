(function() {
    // CONSTANTS
    //==========
    var DELETE_URL = 'delete.php';
    var ICON_PATH = 'assets/img/icons/';

    // HELPER FUNCTIONS
    //=================

    /**
     * Get the extension of a file
     *
     * @param filename
     * @return {String}
     * @private
     */
    var getFileExtension = function(filename) {
        var ext = /^.+\.([^.]+)$/.exec(filename);
        return ext === null ? "" : ext[1].toLowerCase();
    };

    /**
     * Check if a file is an image
     *
     * @param filename
     * @private
     */
    var isImage = function(filename) {
        return ($.inArray(getFileExtension(filename), ['bmp', 'gif', 'jpg', 'jpeg', 'png']) > -1);
    };

    /**
     * Create a thumbnail from an image file
     *
     * @param file
     * @return {*}
     * @private
     */
    var createThumbnail = function(file) {
        // Check if the file is an image and if we can create a thumbnail
        if ((file) && (typeof FileReader != 'undefined')) {
            var reader = new FileReader();
            var img = $('<img/>').addClass('thumbnail').hide().load(function(e) {
                $(e.target).show();
            });
            reader.onload = function (event) {
                img.attr('src', event.target.result);
            };

            reader.readAsDataURL(file);
            return img;
        }
        else {
            return null;
        }
    };

    /**
     * Create icon for a file extension
     *
     * @param filename
     * @return {*}
     * @private
     */
    var createIcon = function(filename) {
        var ext = getFileExtension(filename);
        var extensions = [
            'aac','ai','aiff','avi','c','cpp','css','dat','dmg','doc','exe','flv','gif','h','hpp','html','ics',
            'java','jpg','key','mid','mp3','mp4','mpg','pdf','php','png','ppt','psd','py','qt','rar','rb','rtf',
            'sql','tiff','txt','wav','xls','xml','yml','zip'
        ];
        var icon = ($.inArray(ext, extensions) > -1) ? ext : '_blank';
        icon = ICON_PATH + icon + '.png';

        return $('<img/>', {src: icon}).addClass('icon');
    };



    // DATA API & EVENT HANDLERS
    //==========================

    /**
     * On Add
     *
     * @param e
     */
    var onAdd = function(e) {
        var li = $('#li-' +  e.params.uniqueId);

        // Add icon
        var icon = createIcon(e.params.name);
        li.prepend(icon);

        // Add thumbnail
        var thumbnail;
        if (isImage(e.params.name) && (e.params.file) && (thumbnail = createThumbnail(e.params.file))) {
            // Hide icon
            li.children('.icon').hide();

            // Insert thumbnail
            li.prepend(thumbnail);
        }
    };

    /**
     * On Complete
     *
     * @param e
     */
    var onComplete = function(e) {
        var response = e.params.response;
        var item = $('#li-' + e.params.uniqueId);
        try {
            var json = $.parseJSON(response);
            // Make sure we have an array
            $.isArray(json) || (json = [json]);

            if (json[0] === true) {
                // Successful upload -> check for additional data
                if (json[1]) {
                    for (var i in json[1]) {
                        // Create hidden input, and append to item
                        $('<input/>', {
                            type: 'hidden',
                            name: 'attributes[' + i + '][]'
                        })
                            .val(json[1][i])
                            .appendTo(item);
                    }
                }
            }
            else if (json[0] === false) {
            // Something went wrong -> check for error message
            if (json[1]) {
                alert(json[1]);
            }

            // Remove the item
            item.remove();
            }
            else {
                // The response hasn't the correct format -> remove the item
                try {console.log('The server response is not in JSON format.');} catch(e) {}
                item.remove();
            }
        }
        catch(e) {
            // The response isn't json encoded -> remove the item
            try {console.log('The server response has not the correct format.');} catch(e) {}
            item.remove();
        }
    };

    /**
     * On Remove
     *
     * @param e
     */
    var onRemove= function(e) {
        var item = e.params.item;
        var fileId = item.children('[name="attributes[id][]"]').val();

        if (fileId) {
            // The file was uploaded, delete it
            $.ajax({
                type: 'POST',
                url: DELETE_URL,
                data: { file_id: fileId }
            });
        }
    };

    $(function() {
        $('[data-provide=upload-area]').uploadArea();

        $('[data-provide=upload-area]').on('add', onAdd);
        $('[data-provide=upload-area]').on('complete', onComplete);
        $('[data-provide=upload-area]').on('remove', onRemove);
    });

})(jQuery);