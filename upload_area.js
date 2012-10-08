var UploadArea = pluginController(
    {
        className: false,
        pluginName: 'uploadArea',
        defaults: {
            // Uploader options
            uploader: {
                autoSubmit: true
            }
        }
    },
    {
        // INITIALIZATIONS
        //================

        /**
         * Init
         */
        init: function() {
            // Init vars
            this._initVars();

            // Init elements
            this._initElements();

            // Init event handlers
            this._initEventHandlers();
        },

        /**
         * Init vars
         *
         * @private
         */
        _initVars: function() {
            this.options.uploader.dragArea || (this.options.uploader.dragArea = this.element);
        },

        /**
         * Init elements
         *
         * @private
         */
        _initElements: function() {
            // Init uploader
            this.uploaderElement = this.element.children('[data-provide=uploader]');
            this.uploaderElement.uploader(this.options.uploader);

            // Init file list
            this.listElement = this.element.children('.file-list');
        },

        /**
         * Init event handlers
         *
         * @private
         */
        _initEventHandlers: function() {
            // Bind "select"
            this.uploaderElement.bind('select', $.proxy(this._onAdd, this));

            // Bind "dnd"
            this.uploaderElement.bind('dnd', $.proxy(this._onAdd, this));

            // Bind "submit"
            this.uploaderElement.bind('submit', $.proxy(this._onSubmit, this));

            // Bind "progress"
            this.uploaderElement.bind('progress', $.proxy(this._onProgress, this));

            // Bind "complete"
            this.uploaderElement.bind('complete', $.proxy(this._onComplete, this));
        },



        // EVENT HANDLERS
        //===============

        /**
         * On select/dnd
         *
         * @param e
         * @private
         */
        _onAdd: function(e) {
            // Stop propagation
            e.stopPropagation();

            // Create new item and add to list
            var item = $('<li/>', {
                id: 'li-' + e.params.uniqueId
            });

            this.listElement.append(item);

            // Trigger 'add' event
            var ev = $.Event('add', {params: e.params});
            this.element.trigger(ev);

            if (ev.isDefaultPrevented()) {
                // The default event was prevented
                return;
            }

            this._buildItem(item, ev.params.name);
        },

        /**
         * On submit
         *
         * @param e
         * @private
         */
        _onSubmit: function(e) {
            // Stop propagation
            e.stopPropagation();

            // Get item
            var item = this.listElement.children('#li-' + e.params.uniqueId);

            // Trigger 'submit' event
            var ev = $.Event('submit', {params: e.params});
            this.element.trigger(ev);

            if (ev.isDefaultPrevented()) {
                // The default event was prevented
                return;
            }

            // Show the progress bar or the loading gif
            if ($.support.ajaxUpload) {
                // Show progress bar
                item.children('.progress').show();
            }
            else {
                // Show loading gif
                item.children('.loading').show();
            }
        },

        /**
         * On progress
         *
         * @param e
         * @private
         */
        _onProgress: function(e) {
            // Stop propagation
            e.stopPropagation();

            // Trigger 'progress' event
            var ev = $.Event('progress', {params: e.params});
            this.element.trigger(ev);

            if (ev.isDefaultPrevented()) {
                // The default event was prevented
                return;
            }

            // Get item
            var item = this.listElement.children('#li-' + ev.params.uniqueId);

            // Calculate percentage
            var percentage = (ev.params.loaded * 100) / ev.params.total;

            // Set the bar's width
            item.find('.progress .bar').css('width', percentage + '%');
        },

        /**
         * On complete
         *
         * @param e
         * @private
         */
        _onComplete: function(e){
            // Stop propagation
            e.stopPropagation();

            var ev = $.Event('complete', {params: e.params});
            this.element.trigger(ev);

            if (ev.isDefaultPrevented()) {
                // The default event was prevented
                return;
            }

            // Get item
            var item = this.listElement.children('#li-' + ev.params.uniqueId);

            // Hide progress bar or loading gif
            item.find('.progress').hide();
            item.find('.loading').hide();
        },

        /**
         * Close link click
         *
         * @param a
         */
        '.file-list a.close click': function(a, e) {
            // Prevent default
            e.preventDefault();

            // Get the uploader control
            var uploader = this.uploaderElement.control();

            // Get the item
            var item = $(a).parent();

            // Get the uniqueId
            var uniqueId = item.attr('id').replace('li-', '');

            var inFileList = uploader.inFileList(uniqueId);
            var isUploading = uploader.isUploading(uniqueId);

            var ev = $.Event('remove', {params: {item: $(a).parent(), inFileList: inFileList, isUploading: isUploading}});
            this.element.trigger(ev);

            if (ev.isDefaultPrevented()) {
                // The default event was prevented
                return;
            }

            if (inFileList && isUploading) {
                // The file is uploading: abort and remove
                uploader.abort(uniqueId);

                // Remove from fileList and activeRequests
                uploader.remove(uniqueId);

                // Remove html element
                item.remove();
            }
            else if (inFileList) {
                // The file isn't uploading, but it's in the fileList
                uploader.remove(uniqueId);

                // Remove html element
                item.remove();
            }
            else {
                // Remove html element
                item.remove();
            }
        },



        // HELPERS
        //========

        /**
         * Create an item
         *
         * @param item
         * @param name
         * @private
         */
        _buildItem: function(item, name) {
            // Add a span for name
            $('<span class="name"/>').html(name).appendTo(item);

            // Add close link
            $('<a href="#" class="close" data-behavior="remove" />').html('<span>Remove</span>').appendTo(item);

            // Add progress div
            $('<div class="progress"><div class="bar" style="width: 0%;"></div></div>').hide().appendTo(item);

            // Add loading div
            $('<div class="loading">').hide().appendTo(item);
        }
    }
);