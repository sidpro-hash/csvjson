// js/src/csv2json.js
APP.csv2json = function() {
    var uploadUrl = '/csv2json/upload',
        sepMap = {
            comma: ',',
            semiColon: ';',
            tab: '\t'
        },
        $file = $('#fileupload'),
        $separator = $('select[name=separator]'),
        $parseNumbers = $('input[type=checkbox][name=parseNumbers]'),
        $parseJSON = $('input[type=checkbox][name=parseJSON]'),
        $transpose = $('input[type=checkbox][name=transpose]'),
        $output = $('input[type=radio][name=output]'),
        $csv = $('#csv'),
        $result = $('#result'),
        $clear = $('#clear, a.clear'),
        $convert = $('#convert, a.convert'),
        $minify = $('#minify');
    $convert.click(function(e) {
        e.preventDefault();
        var csv = _.trim($csv.val()),
            separator = $separator.find('option:selected').val(),
            options = {
                transpose: $transpose.is(':checked'),
                hash: $output.filter(':checked').val() == 'hash',
                parseNumbers: $parseNumbers.is(':checked'),
                parseJSON: $parseJSON.is(':checked')
            },
            json;
        if (separator != 'auto') options.separator = sepMap[separator];
        try {
            json = CSVJSON.csv2json(csv, options);
        } catch (error) {
            APP.reportError($result, error);
            return false;
        }
        var result = JSON.stringify(json, null, $minify.is(':checked') ? undefined : 2);
        $result.removeClass('error').val(result).change();
        try {
            if (options.transpose == false && options.hash == false && _.isArray(json) && json.length > 0) {
                var columns = _.keys(json[0]).join(', ');
                if (columns != 'album, year, US_peak_chart_post' && columns != window.csv2json_intrumented_columns) {
                    // They are storing columns in DB
                    // $.post('/csv2json/instrument', {
                    //     columns: columns,
                    //     num_rows: json.length,
                    // });
                    window.csv2json_intrumented_columns = columns;
                }
            }
        } catch (error) {}
    });
    APP.start({
        $convert: $convert,
        $clear: $clear,
        $saveElements: $('input.save, textarea.save'),
        upload: {
            $file: $file,
            url: uploadUrl,
            $textarea: $csv
        }
    });
};

// js/src/home.js
APP.home = function() {};
// js/src/main.js
$(document).ready(function() {
    _.mixin(s.exports());
    _.extend(APP, {
        start: function(options) {
            options || (options = {});
            APP.bindDownload(options.downloadFilename, options.downloadMimeType);
            APP.bindCopy();
            //$('a.save-permalink').on('click', APP.onClickSave);
            if (options.upload) {
                if (!options.upload.$file) throw "Invalid option 'upload'. Missing $file.";
                if (!options.upload.url) throw "Invalid option 'upload'. Missing url.";
                if (!options.upload.$textarea && !options.upload.editor) throw "Invalid option 'upload'. Missing $textarea or editor.";
                APP.bindFileUploadToFillTextarea(options.upload.$file, options.upload.url, options.upload.$textarea, options.upload.editor);
            }
            if (options.$convert) APP.bindConvert(options.$convert);
            if (options.$clear) APP.bindClear(options.$clear);
            //if (options.$saveElements) APP.setInputsForSave(options.$saveElements);
            // $('.container').CacheInputs({
            //     key: APP.page,
            //     ignoreOnStart: !!APP.id
            // });
            // if (APP.id) {
            //     if (APP.data_url) {
            //         $.getJSON(APP.data_url).done(function(data) {
            //             APP.data = data;
            //             APP.restore(options.editor);
            //         });
            //     } else {
            //         APP.restore(options.editor);
            //     }
            // } else {
            //     APP.renderSave('active');
            // }
        },
        // baseUrl: function() {
        //     return window.location.protocol + '//' + window.location.hostname + (window.location.port == 80 ? '' : (':' + window.location.port)) + '/' + APP.page;
        // },
        reportError: function($textarea, error) {
            $textarea.addClass('error').val(error);
        },
        bindClear: function($clear) {
            $clear.click(function(e) {
                e.preventDefault();
                $('textarea.input, textarea.result').val('').removeClass('error').change();
                //APP.renderSave('active');
                return false;
            });
        },
        bindConvert: function($convert) {
            // $convert.click(function(e) {
            //     //APP.renderSave('active');
            // });
        },
        bindFileUploadToFillTextarea: function($file, uploadUrl, $textarea, editor) {
            console.log("saving...")
            var $fileLabel = $file.siblings('label');
            var fileLabelHtml = $fileLabel.html();
            //var file = document.getElementById('fileupload');
            // $file.fileupload({
            //     url: uploadUrl,
            //     pasteZone: null,
            //     progress: function(e, data) {
                    
            //     },
            //     success: function(result) {
            //         $fileLabel.html(fileLabelHtml);
            //         if (editor) {
            //             editor.setValue(result);
            //         } else {
            //             $textarea.val(result).change();
            //         }
            //     },
            //     fail: function(e, data) {
            //         $fileLabel.html(fileLabelHtml);
            //     }
            // });
            
            
            
            $file.fileupload({
               
                change: function (e, data) {
                    console.log(data);
                    const reader = new FileReader();

            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    var progress = parseInt(event.loaded / event.total * 100, 10);
                    $fileLabel.text(progress + '%');
                }
            };
    
            reader.onload = async (event) => {
                const text = event.target.result;
                //document.getElementById("csv").innerText = text;
                $fileLabel.html(fileLabelHtml);
                $textarea.val(text).change();
            };
                        reader.readAsText(data.files[0]);
                    
                }
            });

        },
        bindDownload: function(filename, mimeType) {
            filename || (filename = 'csvjson.json');
            mimeType || (mimeType = 'application/json');
            var $textarea = $('textarea.result'),
                $download = $('a#download'),
                $label = $('a#download').next('em'),
                nodata = 'No data to download. Convert first. ',
                data, copypaste = 'Ctrl + A then Ctrl + C to copy to clipboard. ';
            $download.attr('download', filename);
            $textarea.change(function() {
                data = $textarea.val();
                $download.attr('title', 'Download result in ' + filename);
                $label.text(copypaste);
                if (data) {
                    $download.removeAttr('disabled');
                } else {
                    $download.attr('disabled', 'disabled');
                    $download.attr('title', nodata);
                    $label.text(nodata + copypaste);
                }
            });
            $textarea.change();
            $download.click(function(e) {
                if ($download.attr('disabled')) return;
                e.preventDefault();
                download(new Blob([(filename.indexOf('.csv') >= 0 ? "\uFEFF" : '') + data]), $download.attr('download'), mimeType);
            });
        },
        bindCopy: function() {
            var $textarea = $('textarea.result'),
                $copy = $('a#copy');
            $copy.on('click', function(e) {
                e.preventDefault();
                $textarea[0].select();
                if (navigator.clipboard) {
                    navigator.clipboard.writeText($textarea[0].value);
                } else {
                    document.execCommand('copy');
                }
            });
        }
        // $inputsForSave: [],
        // setInputsForSave: function($inputs) {
        //     APP.$inputsForSave = $inputs;
        //     APP.$inputsForSave.change(function(e) {
        //         APP.renderSave('active');
        //     });
        // },
        // onClickSave: function(e) {
        //     e.preventDefault();
        //     if ($('a.save-permalink').closest('li').hasClass('disabled')) return false;
        //     APP.save();
        // },
        // save: function() {
        //     var url = APP.baseUrl() + '/save';
        //     if (APP.id) url += '/' + APP.id;
        //     var data = {};
        //     APP.$inputsForSave.each(function() {
        //         var $el = $(this),
        //             id = $el.attr('id'),
        //             value = $el.is('input[type=radio], input[type=checkbox]') ? $el.is(':checked') : $el.val();
        //         data[id] = value;
        //     });
        //     APP.renderSave('saving');
        //     return $.ajax(url, {
        //         type: 'POST',
        //         data: JSON.stringify(data),
        //         contentType: 'application/json'
        //     }).done(function(data) {
        //         APP.id = data.id;
        //         var newUrl = APP.baseUrl() + '/' + data.id;
        //         if (window.location.href != newUrl) {
        //             if (window.history && window.history.pushState)
        //                 window.history.pushState("", "", newUrl);
        //             else
        //                 window.location.href = newUrl;
        //         }
        //         APP.renderSave('saved');
        //     }).fail(function(xhr) {
        //         var error = xhr.responseText ? xhr.responseText : 'Unexpected error saving.';
        //         APP.renderSave('error', error);
        //     });
        // },
        // restore: function(editor) {
        //     if (!APP.data) return;
        //     _.each(APP.data, function(value, id) {
        //         var $el = $('#' + id);
        //         if (!$el.length) return true;
        //         if ($el.is('input[type=radio], input[type=checkbox]')) {
        //             if (value) $el.attr('checked', 'checked');
        //         } else {
        //             if ($el.is('textarea.result') && editor) {
        //                 editor.setValue(value);
        //             } else {
        //                 $el.val(value);
        //             }
        //         }
        //         $('textarea.result').change();
        //     });
        //     APP.renderSave('saved');
        // },
        // renderSave: function(state, error) {
        //     var $save = $('a.save-permalink');
        //     switch (state) {
        //         case 'active':
        //             if ($save.hasClass('active')) return;
        //             $save.html('<i class="glyphicon glyphicon-link"></i> Save').attr('title', 'Save a permanent link to come back later, or to share with a colleague.' + (APP.id ? ' Will overwrite your previous work.' : '')).closest('li').removeClass('disabled');
        //             break;
        //         case 'saving':
        //             $save.html('<i class="glyphicon glyphicon-arrow-down"></i> Save').attr('title', 'Please wait...').closest('li').addClass('disabled');
        //         case 'saved':
        //             $save.html('<i class="glyphicon glyphicon-link"></i> Saved').attr('title', 'Copy the URL in the address bar to share, or bookmark it to save for later.').closest('li').addClass('disabled');
        //             break;
        //         case 'error':
        //             $save.html('<i class="glyphicon glyphicon-warning-sign"></i> Error saving').attr('title', error ? error : 'An unexpected error while saving.').closest('li').addClass('disabled');
        //             break;
        //     }
        // }
    });
    $('body').on('click', function(e) {
        $('[data-toggle="popover"]').each(function() {
            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                $(this).popover('hide');
            }
        });
    });
    APP.csv2json();
    // if (APP.run) {
    //     var fn = APP[APP.page];
    //     if (typeof(fn) !== 'function') throw "Module " + APP.page + " not found.";
    //     APP[APP.page]();
    // }
});