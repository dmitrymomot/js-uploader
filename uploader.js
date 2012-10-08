var Uploader = pluginController(
    {
        className: false,
        pluginName: 'uploader',
        defaults: {
            // Name of the input field
            name: 'file',

            // Whether multiple upload is enabled
            multiple: true,

            // The url to post data to
            action: 'upload.php',

            // Submit method
            method: 'POST',

            // Enctype to use
            enctype: 'multipart/form-data',

            // Automatically submit a file after it was selected
            autoSubmit: true,

            // Additional parameters to post with the files
            params: {},

            // jQuery selector/Html element to use as drag area
            dragArea: null,

            // Unique id prefix, to use when creating unique ids
            uniqueIdPrefix: 'upload_'
        }
    },
    {
        // INITIALIZATIONS
        //================

        /**
         * Init
         */
        init: function() {
            // Initialize vars
            this._initVars();

            // Create container and input elements
            this._initElements();
        },

        /**
         * Init vars
         *
         * @private
         */
        _initVars: function() {
            // Init file list
            this.fileList = {};

            // Init request list
            this.activeRequests = {};

            // Get "name" from data attribute
            if (this.element.attr('data-name')) {
                this.options.name = this.element.attr('data-name');
            }

            // Get "multiple" from data attribute
            if (this.element.attr('data-multiple')) {
                this.options.multiple = (this.element.attr('data-multiple') == 'true');
            }

            // Make sure browser supports multiple
            this.options.multiple = (this.options.multiple && $.support.multipleUpload);

            // Get "action" from data attribute
            if (this.element.attr('data-action')) {
                this.options.action = this.element.attr('data-action');
            }

            // Get "method" from data attribute
            if (this.element.attr('data-method')) {
                this.options.method = this.element.attr('data-method');
            }

            // Get "enctype" from data attribute
            if (this.element.attr('data-enctype')) {
                this.options.enctype = this.element.attr('data-enctype');
            }

            // Get "auto-submit" from data attribute
            if (this.element.attr('data-auto-submit')) {
                this.options.autoSubmit = (this.element.attr('data-auto-submit') == 'true');
            }
        },


        /**
         * Create the elements
         *
         * @private
         */
        _initElements: function() {
            // Create the container
            this._createContainer();

            // Create the input element
            this._createInput();

            // Init d&d
            this._initDnd();
        },

        /**
         * Create the container
         *
         * @private
         */
        _createContainer: function() {
            // Create the container, make it invisible and append it to body
            this.container = $('<div/>').css({
                position: 'absolute',
                left: -999 + 'px',
                top: -999 + 'px',
                background: '#ffffff',
                opacity: 0
            }).appendTo(document.body);
        },

        /**
         * Create the input element
         *
         * @private
         */
        _createInput: function() {
            // Create input and append to body
            this.inputElement = $('<input/>', {
                name: this.options.name,
                type: 'file'
            }).css({
                border: 'none',
                outline: 'none'
            }).appendTo(this.container);

            // Set it multiple
            if (this.options.multiple) {
                this.inputElement.attr('multiple', 'multiple');
            }

            // Do the transparent input hack if needed, or bind element onclick to open dialog
            if (this.needsTIHack()) {
                this._doTIHack();
            }
            else {
                this.element.off('click', '', $.proxy(this._openDialog, this));
                this.element.on('click', '', $.proxy(this._openDialog, this));
            }

            // Set up onChange behavior
            this.inputElement.on('change', '', $.proxy(this._onSelect, this));
        },

        /**
         * Init drag&drop
         *
         * @private
         */
        _initDnd: function() {
            if (this.options.dragArea) {
                // Get holder
                var holder = $(this.options.dragArea)[0];

                // Set up event handlers
                holder.ondragover = function(e) {                                        
                    e && e.preventDefault();

                    if ($.support.dndUpload) {
                        $(this).addClass('hover');
                    }
                    return false;
                };

                holder.ondragend = function() {
                    e && e.preventDefault();

                    if ($.support.dndUpload) {
                        $(this).removeClass('hover');
                    }
                    return false;
                };

                holder.ondrop = $.proxy(function(e) {
                    e && e.preventDefault();
                    
                    if ($.support.dndUpload) {
                        $(holder).removeClass('hover');
                        $.each(e.dataTransfer.files, $.proxy(function(i, file) {
                            this._onDnd(file);
                        }, this));
                    }                    
                    return false;
                }, this);
            }
        },

        /**
         * Do the transparent input hack
         *
         * @private
         */
        _doTIHack: function() {
            // Set the size and the position of the div
            var pos = this.element.position();
            this.container.css({
                left:   pos.left + 'px',
                top:    pos.top + 'px',
                width:  this.element.outerWidth(),
                height:  this.element.outerHeight(),
                cursor: this.element.css('cursor'),
                overflow: 'hidden',
                border: 'none'
            });

            // Update the input
            this.inputElement.css({
                cursor: this.element.css('cursor'),
                border: 0,
                margin: 0,
                padding: 0,
                position: 'relative',
                opacity: 0
            });

            // Move the input with the mouse to make sure it gets clicked!
            this.container.off().on('mousemove', '', $.proxy(function(e) {
                this.inputElement.css({
                    top: e.pageY - this.container.offset().top - 10 +'px',
                    left: e.pageX - this.container.offset().left - this.inputElement.outerWidth() + 10 + 'px'
                });
            }, this));
        },



        // AJAX METHODS
        //=============

        /**
         * On input change
         *
         * @private
         */
        _ajaxOnSelect: function() {
            $.each(this.inputElement[0].files, $.proxy(function(i, file) {
                // Create unique id for the file
                var uniqueId = $.uniqueId('file');

                // Add to file list
                this.fileList[uniqueId] = {
                    name: file.name,
                    file: file
                };

                // Trigger "select" event
                this.element.trigger($.Event('select', {params: {
                    name: file.name,
                    uniqueId: uniqueId,
                    file: file
                }}));
            }, this));
        },

        /**
         * Create a new XMLHttpRequest
         *
         * @return {XMLHttpRequest}
         * @private
         */
        _createXMLHttpRequest: function(uniqueId) {
            // Create new request
            var xhr = new XMLHttpRequest();
            var upload = xhr.upload;

            // On Load
            xhr.onload = $.proxy(function(ev) {
                this._onComplete('ajax', ev.target.responseText, ev.target, uniqueId);
            }, this);

            // On Error
            xhr.onerror = $.proxy(function(ev) {
                this._onFail('ajax', ev.target.responseText, ev.target, uniqueId);
            }, this);

            // On Abort
            xhr.onabort = $.proxy(function() {
                this._onAbort(uniqueId);
            }, this);

            // On Progress
            upload.onprogress = $.proxy(function(progress) {
                this._onProgress(progress.loaded, progress.total, uniqueId);
            }, this);

            return xhr;
        },

        /**
         * Upload a file by uniqueId
         *
         * @param uniqueId
         * @private
         */
        _ajaxUpload: function(uniqueId) {
            this._ajaxSendFile(this.fileList[uniqueId].file, uniqueId);
        },

        /**
         * Send a file to server
         *
         * @param file
         * @param uniqueId
         * @private
         */
        _ajaxSendFile: function(file, uniqueId) {
            // Create new request
            var xhr = this._createXMLHttpRequest(uniqueId);

            // Add to active requests
            this.activeRequests[uniqueId] = xhr;

            // Create form data
            var formData = new FormData();
            formData.append(this.options.name, file);

            // Add additional params to the form
            for (var name in this.options.params) {
                formData.append(name, this.options.params[name]);
            }

            // Open
            xhr.open(this.options.method, this.options.action, true);

            // Send
            xhr.send(formData);
        },

        /**
         * Abort an ajax request
         *
         * @param uniqueId
         * @private
         */
        _ajaxAbort: function(uniqueId) {
            if (this.isUploading(uniqueId)) {
                // Abort request
                this.activeRequests[uniqueId].abort();
            }
        },



        // IFRAME METHODS
        //===============

        /**
         * On input change
         * @private
         */
        _iFrameOnSelect: function() {
            // Create unique id for the file
            var uniqueId = $.uniqueId('file');

            // Set id for inputElement
            this.inputElement.attr('id', uniqueId);

            // Add the input to file list
            this.fileList[uniqueId] = {
                name: this._fileName(this.inputElement.val()),
                input: this.inputElement
            };

            // Trigger "select" event
            this.element.trigger($.Event('select', {params: {
                name: this._fileName(this.inputElement.val()),
                uniqueId: uniqueId,
                file: null
            }}));

            // Detach inputElement
            this.inputElement.detach();

            // Create new inputElement
            this._createInput();
        },

        /**
         * Create the form
         * @private
         */
        _createForm: function(uniqueId) {
            // Create the form
            return $('<form/>', {
                enctype: this.options.enctype,
                method: this.options.method,
                action: this.options.action,
                id: uniqueId + '_form'
            }).css({
                display: 'none'
            }).appendTo(document.body);
        },

        /**
         * Create the hidden iframe
         *
         * @private
         */
        _createIFrame: function(uniqueId) {
            // Create the iframe
            var iFrame = $('<iframe name="' + uniqueId + '_iframe' + '" id="' + uniqueId + '_iframe' + '"></iframe>')
                .css('display', 'none')
                .appendTo(document.body);

            // iFrame onLoad
            iFrame.unbind().load($.proxy(function() {
                // Get a response from the server in plain text
                var response = iFrame.contents().find('body').text();

                // It is possible that content wasn't rendered yet (bug in Opera 10.0 (and maybe some other versions))
                if ( ! response) {
                    // We need to do some magic here
                    this._readIframeTrick(iFrame, uniqueId, 0);
                }
                else {
                    this._onComplete('iframe', response, null, uniqueId);
                }
            }, this));

            return iFrame;
        },

        /**
         * Try to read iFrame content several times
         *
         * @param iFrame
         * @param uniqueId
         * @param n
         * @private
         */
        _readIframeTrick: function(iFrame, uniqueId, n) {
            var response = iFrame.contents().find('body').text();

            if (response || n >= 5) {
                this._onComplete('iframe', response, null, uniqueId);
            }
            else {
                setTimeout($.proxy(function() {
                    this._readIframeTrick(iFrame, uniqueId, n + 1);
                }, this), 1000);
            }
        },

        /**
         * Iframe upload
         *
         * @param uniqueId
         * @private
         */
        _iFrameUpload: function(uniqueId) {
            // Create form and iFrame for the file
            var form = this._createForm(uniqueId);
            var iFrame = this._createIFrame(uniqueId);

            // Set iFrame as form target
            form.attr('target', uniqueId + '_iframe');

            // Add the input to form
            this.fileList[uniqueId].input.appendTo(form);

            // Add additional params to form
            for (var name in this.options.params) {
                $('<input/>', {
                    type: 'hidden',
                    name: name,
                    value: this.options.params[name]
                }).appendTo(form);
            }

            // Submit the form
            form.submit();

            // Add the iFrame to active requests list
            this.activeRequests[uniqueId] = iFrame[0];
        },

        /**
         * Abort an upload
         *
         * @param uniqueId
         * @private
         */
        _iFrameAbort: function(uniqueId) {
            if (this.isUploading(uniqueId)) {
                // Stop the request
                if($.browser.msie)
                {
                    this.activeRequests[uniqueId].contentWindow.document.execCommand('Stop');
                }
                else
                {
                    this.activeRequests[uniqueId].contentWindow.stop();
                }

                // Call onAbort
                this._onAbort(uniqueId);
            }
        },


        // API METHODS
        //============

        /**
         * Upload a file
         *
         * @param uniqueId
         * @private
         */
        upload: function(uniqueId) {
            // Make sure the file is in list, and it isn't uploading right now
            if ((this.inFileList(uniqueId)) && ( ! this.isUploading(uniqueId))) {
                // Trigger "submit" event
                this.element.trigger($.Event('submit', {params: {
                    name: this.fileList[uniqueId].name,
                    uniqueId: uniqueId
                }}));

                // Execute the appropriate "upload" function
                this[$.support.ajaxUpload ? '_ajaxUpload' : '_iFrameUpload'](uniqueId);
            }
        },

        /**
         * Upload all files
         *
         * @private
         */
        uploadAll: function() {
            for (var uniqueId in this.fileList) {
                this.upload(uniqueId);
            }
        },

        /**
         * Check if a file is in file list
         *
         * @private
         *
         * @param uniqueId
         * @return {Boolean}
         */
        inFileList: function(uniqueId) {
            return (typeof this.fileList[uniqueId] != 'undefined');
        },

        /**
         * Check if a file is currently uploading
         *
         * @param uniqueId
         * @return {Boolean}
         * @private
         */
        isUploading: function(uniqueId) {
            return (typeof this.activeRequests[uniqueId] != 'undefined');
        },

        /**
         * Abort an upload request
         *
         * @param uniqueId
         * @private
         */
        abort: function(uniqueId) {
            // Make sure the file is uploading
            if (this.isUploading(uniqueId)) {
                this[$.support.ajaxUpload ? '_ajaxAbort' : '_iFrameAbort'](uniqueId);
            }
        },

        /**
         * Removes a file from fileList
         *
         * @param uniqueId
         * @private
         */
        remove: function(uniqueId) {
            // Check if file exists, and if it's not uploading right now
            if ( ! this.inFileList(uniqueId)) {
                return;
            }

            if (this.isUploading(uniqueId)) {
                throw Error('The file: "' + uniqueId + '" is uploading right now, and can not be removed. ' +
                            'If you want to abort uploading the file, use the "abort" function.');
            }

            delete this.fileList[uniqueId];
        },


        // EVENT HANDLERS
        //===============

        /**
         * On file select
         *
         * @private
         */
        _onSelect: function() {
            // Execute the appropriate function
            this[$.support.ajaxUpload ? '_ajaxOnSelect' : '_iFrameOnSelect']();

            // Submit if autoSubmit
            if (this.options.autoSubmit) {
                this.uploadAll();
            }
        },

        /**
         * On drag&drop file
         *
         * @param file
         * @private
         */
        _onDnd: function(file) {
            // Create unique id for the file
            var uniqueId = $.uniqueId('file');

            // Add to file list
            this.fileList[uniqueId] = {
                name: file.name,
                file: file
            };

            // Trigger "drag & drop"
            this.element.trigger($.Event('dnd', {params: {
                name: file.name,
                uniqueId: uniqueId,
                file: file
            }}));

            // Submit if autoSubmit
            if (this.options.autoSubmit) {
                this.upload(uniqueId);
            }
        },

        /**
         * Upload complete
         *
         * @param type
         * @param xhr
         * @param uniqueId
         * @private
         */
        _onComplete: function(type, response, xhr, uniqueId) {
            // Trigger "complete"
            this.element.trigger($.Event('complete', {params: {
                name: this.fileList[uniqueId].name,
                uniqueId: uniqueId,
                response: response,
                type: type,
                xhr: xhr
            }}));

            // Cleanup
            this._cleanUp(uniqueId);
        },

        /**
         * Upload error (error on network level)
         *
         * @param type
         * @param xhr
         * @param uniqueId
         * @private
         */
        _onFail: function(type, response, xhr, uniqueId) {
            this._onComplete(type, response, xhr, uniqueId);
        },

        /**
         * Upload abort
         *
         * @param uniqueId
         * @private
         */
        _onAbort: function(uniqueId) {
            // Trigger "abort" event
            this.element.trigger($.Event('abort', {params: {
                name: this.fileList[uniqueId].name,
                uniqueId: uniqueId
            }}));

            // Cleanup
            this._cleanUp(uniqueId);
        },

        /**
         * Do cleanup after upload complete/fail/abort
         *
         * @param uniqueId
         * @private
         */
        _cleanUp: function(uniqueId) {
            // Remove file from fileList
            delete this.fileList[uniqueId];

            // Remove request from active requests
            delete this.activeRequests[uniqueId];

            // Remove the form and the iframe (if exists)
            $('#' + uniqueId + '_form').remove();
            $('#' + uniqueId + '_iframe').remove();
        },

        /**
         * Upload progress
         *
         * @param loaded
         * @param total
         * @param uniqueId
         * @private
         */
        _onProgress: function(loaded, total, uniqueId) {
            // Trigger "progress"
            this.element.trigger($.Event('progress', {params: {
                name: this.fileList[uniqueId].name,
                uniqueId: uniqueId,
                loaded: loaded,
                total: total
            }}));
        },

        /**
         * Extract filename from path
         *
         * @param file
         * @return {String}
         * @private
         */
        _fileName: function(file) {
            return file.replace(/\\/g, '/').split('/').pop(-1);
        },

        /**
         * Open the file browser dialog
         *
         * @private
         */
        _openDialog: function(e) {
            this.inputElement.click();

            // Prevent default
            e.preventDefault();
        },

        /**
         * Check if we need to do the transparent input hack
         *
         * @return {Boolean}
         * @private
         */
        needsTIHack: function() {
            return (($.browser.mozilla) && ($.compareVersions($.browser.version, '4.0') == 2)) ||
                    ($.browser.opera) || ($.browser.msie);
        }
    }
);