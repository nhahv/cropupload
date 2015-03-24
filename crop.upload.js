(function ($) {
    $.CropUpload = function (element, options) {
        var image = {
            sid: undefined,
            cropData: {
                x: 0, y: 0, w: 0, h: 0, z: 0
            }
        }

        var defaults = {
            maxFiles: 5,
            previewSize: {w: 320, h: 320},
            thumbSize: {w: 96, h: 96},
            onUpdated: function (data) {
            },
            getData: function () {
                return getData()
            }
        }
        var plugin = this;
        plugin.settings = {}
        var $element = $(element),
            element = element;
        plugin.init = function () {
            plugin.images = [];
            plugin.settings = $.extend({}, defaults, options);
            var preview = '<div id="image-cropper">' +
                    '<div class="previewtransparent">' +
                    '<div class="cropit-image-preview"></div>' +
                    '</div>' +
                    '<div style="clear: both"></div>' +
                    '<div class="range-control"><i class="mdi mdi-terrain"></i>' +
                    '<input type="range" class="cropit-image-zoom-input custom" />' +
                    '<i class="mdi mdi-terrain medium"></i></div>'
                ;
            $element.prepend(preview);


            $('#image-cropper', $element).cropit(
                {
                    imageState: {src: ''},
                    onUpdated: function (data) {
                        if (data) {
                            //updateImage(data.sid,data);
                            var $thumb = $('*[sid="' + data.sid + '"]');
                            $thumb.attr('cropdata', JSON.stringify(data));
                            updateThumbPosition($thumb);
                            plugin.getData();
                            //$('#imageCropData2').text(JSON.stringify(data, null, 2));
                        }
                    },
                    onImageLoaded: function () {
                        var cropData = JSON.parse($(this)[0].$preview.attr('cropdata'));
                        $('#image-cropper', $element).cropit('zoom', cropData.z);
                        $('#image-cropper', $element).cropit('offset', {
                            x: cropData.x * cropData.z, y: cropData.y * cropData.z
                        });
                    }
                });

            $('#image-cropper', $element).cropit('previewSize', {
                width: this.settings.previewSize.w,
                height: this.settings.previewSize.h
            });
            $('.uploaded', $element).sortable({
                itemSelector: 'div.thumb_container',
                placeholder: '<div class="thumb_container placeholder" style="width:' + plugin.settings.thumbSize.w + 'px;height:' + plugin.settings.thumbSize.h + 'px"/>',

                onDragStart: function ($item, container, _super, event) {
                    $item.css({
                        'position': 'absolute',
                        'z-index': 99999,
                        'box-shadow': '2px 2px 5px gray',
                        'opacity': 0.8
                    })
                },
                onDrop: function ($item, container, _super, event) {
                    $('.uploaded .thumb_container', $element).each(function () {
                        $('.thumb', $(this)).attr('sort', $(this).index());
                        $('.thumb', $(this)).attr('edited', true);
                    });
                    plugin.getData();
                    $item.removeClass("dragged").removeAttr("style")
                    $("body").removeClass("dragging")
                    _super($item, container)

                }

            });
            $('div.thumb', $element).each(function () {
                var sid = $(this).attr('sid');
                if (sid != 'undefined') {
                    //addImage({sid:sid})
                    var panel = createThumbControlPanel(sid);
                    $(this).parent().append(panel);
                }
                updateThumbPosition($(this));
            });

            bindThumbControlPanelEvent($element);
            createUploadButton($element);
            bindUploadButtionEvent($element);

            $('.uploaded .thumb', $element).first().trigger('click');

            $('div.previewtransparent', $element).css({
                width: this.settings.previewSize.w,
                height: this.settings.previewSize.h
            })

            $('div.uploaded div.thumb_container,.btn-upload', $element).each(function () {
                $(this).css('width', plugin.settings.thumbSize.w + 'px');
                $(this).css('height', plugin.settings.thumbSize.h + 'px');
                $(this).find('div.thumb').css('width', plugin.settings.thumbSize.w + 'px');
                $(this).find('div.thumb').css('height', plugin.settings.thumbSize.h + 'px');
            });


        }
        var bindThumbControlPanelEvent = function ($element) {
            $($element).on('click', 'i[id^="d:"]', function () {
                var $parent = $(this).parent();
                $(this).hide();
                $('i[id^="r:"]', $parent).show();
                $('i[id^="c:"]', $parent).show();
            });
            //Khi nut remove click;
            $($element).on('click', 'i[id^="r:"]', function () {
                var $parent = $(this).parent();
                $(this).hide();
                var sid = $(this).attr('id').replace('r:', '');
                var $thumb = $('.thumb[sid="' + sid + '"]');
                $thumb.attr('removed', true);
                $thumb.attr('edited', true);
                $('i[id^="c:"]', $parent).hide();
                $('i[id^="u:"]', $parent).show();
                plugin.getData();
            });
            $($element).on('click', 'i[id^="c:"]', function () {
                var $parent = $(this).parent();
                $(this).hide();
                $('i[id^="d:"]', $parent).show();
                $('i[id^="c:"]', $parent).hide();
                $('i[id^="r:"]', $parent).hide();
                plugin.getData();
            });
            //Khi nut redo click
            $($element).on('click', 'i[id^="u:"]', function () {
                var $parent = $(this).parent();
                $(this).hide();
                var sid = $(this).attr('id').replace('u:', '');
                var $thumb = $('.thumb[sid="' + sid + '"]');
                $thumb.attr('removed', false);
                $thumb.attr('edited', true);
                $('i[id^="d:"]', $parent).show();
                $('i[id^="c:"]', $parent).hide();
                $('i[id^="r:"]', $parent).hide();
                plugin.getData();
            });
            $element.on('click', 'i[id^="cr:"]', function () {
                var sid = $(this).attr('id').replace('cr:', '');
                var $thumb = $('.thumb[sid="' + sid + '"]');
                var url = $thumb.attr('url');
                var cropData = $thumb.attr('cropdata');
                $thumb.attr('edited', true);
                if (!(cropData === undefined)) {
                    $('#image-cropper div.cropit-image-preview', $element).attr('cropdata', cropData);
                }
                $('#image-cropper', $element).cropit('reenable');
                $('#image-cropper', $element).cropit('imageSrc', url);
                $('#image-cropper', $element).cropit('sid', sid);

                $('#image-cropper div.cropit-image-preview', $element).css({
                    'cursor': 'move'
                });

            });
            $element.on('click', 'div.thumb', function () {
                var cropData = $(this).attr('cropdata');
                //$thumb.attr('edited',true);
                if (cropData) {
                    $('#image-cropper div.cropit-image-preview', $element).attr('cropdata', cropData);
                } else {
                    $('#image-cropper div.cropit-image-preview', $element).removeAttr('cropdata');
                }
                $('#image-cropper div.cropit-image-preview', $element).css(
                    {
                        'background-image': $(this).css('background-image'),
                        'background-size': 'contain',
                        'background-position': '0px 0px'
                    }
                );
                $('.cropit-image-preview.cropit-image-loaded', $element).css({
                    'cursor': 'auto'
                });


                $('#image-cropper', $element).cropit('disable');

                updatePreviewPosition($('#image-cropper div.cropit-image-preview', $element));
            })
            $('div.thumb', $element).each(function () {
                if ($(this).attr('removed') == 'true') {
                    var $parent = $(this).parent();
                    $('i[id^="d:"]', $parent).hide();
                    $('i[id^="c:"]', $parent).hide();
                    $('i[id^="u:"]', $parent).show();
                    plugin.getData();
                }
            });
        }
        var createThumbControlPanel = function (sid) {
            var panel = '' +
                '<div class="panel">' +
                '<div class="left">' +
                '<i class="mdi mdi-crop" id="cr:' + sid + '"></i>' +
                '</div>' +
                '<div class="right">' +
                '<i class="mdi mdi-delete" id="d:' + sid + '"></i>' +
                '<i class="mdi mdi-check" style="color: dodgerblue;display: none" id="r:' + sid + '"></i>' +
                '<i class="mdi mdi-close" style="color: red;display: none" id="c:' + sid + '"></i>' +
                '<i class="mdi mdi-undo-variant" style="display: none" id="u:' + sid + '"></i>' +
                '</div>' +
                '</div>';
            return panel;
        }


        var createUploadButton = function ($element) {
            var inputHTML = $('<input />', {
                type: 'file', accept: 'image/*', multiple: true, id: 'upload'
            });
            $element.append(inputHTML);

            var html = $('<div />', {
                class: 'btn-upload',
                id: 'btnupload'
            })
                .append('<i class="mdi mdi-upload uic"></i>');
            $('.uploaded', $element).prepend(html);
            $('.uploaded', $element).filedrop({
                fallback_id: 'upload',
                url: '/admin/images/upload',
                paramname: 'fileInfo',
                data: {
                    clientid: generateId()
                },
                dragOver: function () {
                    // user dragging files over #dropzone
                    $(this).addClass('dragover');
                },
                dragLeave: function () {
                    // user dragging files out of #dropzone
                    $(this).removeClass('dragover');

                },
                drop: function () {
                    // user drops file
                    $(this).removeClass('dragover');
                },
                beforeSend: function (file, i, done) {
                    file.clientid = generateId();
                    // file is a file object
                    // return false to cancel upload
                    displayDroppedImageFile(file);
                    $('#' + file.clientid).parents('.thumb_container').find('progress').fadeTo(500, 1);
                    done();
                },
                progressUpdated: function (i, file, progress) {
                    console.log('UP: ' + file.clientid + ' | ' + progress);
                    var pb = $('#' + file.clientid).parents('.thumb_container').find('progress');
                    pb.val(progress);
                    // this function is used for large files and updates intermittently
                    // progress is the integer value of file being uploaded percentage to completion
                    //
                }
                , uploadFinished: function (i, file, response, time) {
                    console.log(response);
                    console.log(time);
                    var thumb = $('#' + file.clientid);
                    thumb.parents('.thumb_container').find('progress').fadeTo(500, 0);

                    var image = {};
                    //image.clientid = response.clientid;
                    image.sid = response.id;
                    image.url = response.origin_path;

                    var panel = createThumbControlPanel(response.id);
                    thumb.parent().append(panel);

                    //prev.parent().addClass('thumb');
                    thumb.attr('sid', image.sid);
                    thumb.attr('url', image.url);
                    $('.uploaded .thumb_container', $element).each(function () {
                        $('.thumb', $(this)).attr('sort', $(this).index());
                        $('.thumb', $(this)).attr('edited', true);
                    })
                    thumb.css({'background-image': 'url(\'' + image.url + '\')'});
                    //thumb.css({'background-image':'url:(\''+image.url+'\')'});
                    thumb.fadeTo(500, 1);
                }
                , afterAll: function () {
                    plugin.getData();
                }

            });
        }


        plugin.getData = function () {
            var images = [];
            $('.thumb[edited]', $element).each(function () {
                var $this = $(this);
                var image = {};
                image.id = $this.attr('sid');
                image.edited = true;
                if($this.is('[removed]') && $this.attr('removed') != ''){
                    image.removed = $this.attr('removed') == 'true';
                }
                if($this.is('[cropdata]') && $this.attr('cropdata') != ''){
                    var cr = JSON.parse($this.attr('cropdata'));
                    image.cropdata = cr;
                }
                image.sort = $this.attr('sort');
                images.push(image);
            });
            plugin.settings.onUpdated(images);
            return images;
        }


        var displayDroppedImageFile = function (file) {
            var clientid = file.clientid;
            var fileInfo = {};
            fileInfo.filename = file.name;
            var reader = new FileReader();
            reader.onload = function (e) {
                fileInfo.data = e.target.result;
                fileInfo.clientid = clientid;
                var html = $('<div />', {
                        //id:''+clientid,
                        class: 'thumb_container',
                        style: 'width:' + plugin.settings.thumbSize.w + 'px;' + 'height:' + plugin.settings.thumbSize.h + 'px;'
                    })
                        .append($('<div/>',
                            {
                                class: 'thumb',
                                id: '' + clientid,
                                //draggable:true,

                                style: 'width:' + plugin.settings.thumbSize.w + 'px;' + 'height:' + plugin.settings.thumbSize.h + 'px;'
                                + 'opacity:0.5'//'background-image:url('+e.target.result+');'
                            })
                    )
                        .append($('<progress />', {
                            max: 100,
                            value: 0
                        }))
                    ;
                $('div.uploaded', $element).append(html);
                $('#' + clientid, $element).css({'background-image': 'url(' + e.target.result + ')'});

                $('div.uploaded div.thumb_container,.btn-upload', $element).each(function () {
                    $(this).css('width', plugin.settings.thumbSize.w + 'px');
                    $(this).css('height', plugin.settings.thumbSize.h + 'px');
                    $(this).find('div.thumb').css('width', plugin.settings.thumbSize.w + 'px');
                    $(this).find('div.thumb').css('height', plugin.settings.thumbSize.h + 'px');
                });
                //console.log(e.target.result);

                /*                $.ajax({
                 url: "/admin/images/upload",
                 type: "POST",
                 data: fileInfo,
                 success:function(data){
                 console.log(data);
                 var thumb = $('#'+ data.clientid);
                 var image = {};
                 image.clientid = data.clientid;
                 image.sid = data.id;
                 image.url = data.origin_path;

                 var panel = createThumbControlPanel(data.id);
                 thumb.parent().append(panel);

                 //prev.parent().addClass('thumb');
                 thumb.attr('sid',image.sid);
                 thumb.attr('url',image.url);
                 thumb.css({'background-image':'url(\''+image.url+'\')'});
                 //thumb.css({'background-image':'url:(\''+image.url+'\')'});
                 thumb.fadeTo(500,1);
                 },
                 error: function (xhr, ajaxOptions, thrownError) {
                 alert(xhr.responseText);
                 alert(thrownError);
                 }


                 });*/
            }
            reader.readAsDataURL(file);

        }


        var bindUploadButtionEvent = function ($element) {
            $element.on('click', '.btn-upload', function () {
                $('input#upload', $element).trigger('click');
            });

            $element.on('dkm', 'input#upload', function () {
                var $this = $(this)[0];
                var files = $this.files;
                var file;
                // loop trough files
                var fileData = [];
                for (var i = 0; i < files.length; i++) {


                    // get item
                    file = files.item(i);
                    var fileInfo = {};
                    fileInfo.filename = file.name;


                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var uiid = generateId();
                        fileInfo.data = e.target.result;
                        fileInfo.clientid = uiid;
                        var html = $('<div />', {

                            class: 'thumb_container',
                            style: 'width:' + plugin.settings.thumbSize.w + 'px;' + 'height:' + plugin.settings.thumbSize.h + 'px;'
                        })
                            .append($('<div/>',
                                {
                                    class: 'thumb',
                                    id: '' + uiid,

                                    style: 'width:' + plugin.settings.thumbSize.w + 'px;' + 'height:' + plugin.settings.thumbSize.h + 'px;'
                                    + ''//'background-image:url('+e.target.result+');'
                                })
                        );
                        $('div.uploaded', $element).append(html);
                        $('#' + uiid, $element).css({'background-image': 'url(' + e.target.result + ')'});

                        $('div.uploaded div.thumb_container,.btn-upload', $element).each(function () {
                            $(this).css('width', plugin.settings.thumbSize.w + 'px');
                            $(this).css('height', plugin.settings.thumbSize.h + 'px');
                            $(this).find('div.thumb').css('width', plugin.settings.thumbSize.w + 'px');
                            $(this).find('div.thumb').css('height', plugin.settings.thumbSize.h + 'px');
                        });
                        console.log(e.target.result);

                        $.ajax({
                            url: "/admin/images/upload",
                            type: "POST",
                            data: fileInfo,
                            success: function (data) {
                                console.log(data);
                                var thumb = $('#' + data.clientid);
                                var image = {};
                                image.clientid = data.clientid;
                                image.sid = data.id;
                                image.url = data.origin_path;

                                var panel = createThumbControlPanel(data.id);
                                thumb.parent().append(panel);


                                //prev.parent().addClass('thumb');
                                thumb.attr('sid', image.sid);
                                thumb.attr('url', image.url);
                                thumb.css({'background-image': 'url(\'' + image.url + '\')'});
                                //thumb.css({'background-image':'url:(\''+image.url+'\')'});
                                thumb.fadeTo(500, 1);
                                plugin.getData();

                            },
                            error: function (xhr, ajaxOptions, thrownError) {
                                alert(xhr.responseText);
                                alert(thrownError);
                            }


                        });
                    }
                    reader.readAsDataURL(file);


                }

            })


        }


        var generateId = function (current) {

                var d = new Date().getTime();
                var uuid = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = (d + Math.random()*16)%16 | 0;
                    d = Math.floor(d/16);
                    return (c=='x' ? r : (r&0x3|0x8)).toString(16);
                });
                return uuid;

            //
            //
            //
            //return 'xxxxxxxx'.replace(/[xy]/g, function (c) {
            //    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            //    return v.toString(16);
            //});
        }

        var updateThumbPosition = function ($element) {
            var cdata = $element.attr('cropdata');
            if (typeof cdata == 'undefined' || cdata == '') return;
            var data = JSON.parse(cdata);
            if (typeof data != 'undefined') {
                var dm = {};
                var ratio_x = plugin.settings.thumbSize.w / plugin.settings.previewSize.w;
                var ratio_y = plugin.settings.thumbSize.h / plugin.settings.previewSize.h;
                dm.x = data.x * data.z * ratio_x;
                dm.y = data.y * data.z * ratio_y;
                dm.ow = data.ow * data.z * ratio_x;
                dm.oh = data.oh * data.z * ratio_y;
                //json(dm);
                $element.css({
                    'background-size': dm.ow + 'px ' + dm.oh + 'px',
                    'background-position-x': dm.x + 'px',
                    'background-position-y': dm.y + 'px'
                })
            }
        }
        var updatePreviewPosition = function ($element) {
            var cdata = $element.attr('cropdata');
            if (typeof cdata == 'undefined' || cdata == '') return;
            var data = JSON.parse(cdata);
            if (typeof data != 'undefined') {
                var dm = {};
                var ratio_x = plugin.settings.previewSize.w / plugin.settings.previewSize.w;
                var ratio_y = plugin.settings.previewSize.h / plugin.settings.previewSize.h;
                dm.x = data.x * data.z * ratio_x;
                dm.y = data.y * data.z * ratio_y;
                dm.ow = data.ow * data.z * ratio_x;
                dm.oh = data.oh * data.z * ratio_y;
                //json(dm);
                $element.css({
                    'background-size': dm.ow + 'px ' + dm.oh + 'px',
                    'background-position-x': dm.x + 'px',
                    'background-position-y': dm.y + 'px'
                })
            }
        }
        plugin.init();

    }


    $.fn.CropUpload = function (options) {
        var dataKey = "plugin_CropUpload";
        var plugin = $(this).data(dataKey);
        // has plugin instantiated ?
        if (plugin instanceof $.CropUpload) {
            // if have options arguments, call plugin.init() again
            if (typeof options !== 'undefined') {
                plugin.init(options);
            }
        } else {
            plugin = new $.CropUpload(this, options);
            this.data(dataKey, plugin);
        }
        return plugin;

    };
})(jQuery);


function showData() {
    var images = [];
    $('.thumb[edited]').each(function () {
        var $this = $(this);
        var image = {};
        image.sid = $this.attr('sid');
        image.edited = true;
        image.removed = $this.attr('removed') == 'true';
        image.cropdata = $this.attr('cropdata');
        image.sort = $this.attr('sort');
        images.push(image);
    });

    json(images);

    $.ajax({
        type: "POST",
        url: "/admin/images/crop",
        data: {cropdata: JSON.stringify(images)},
        success: function (data) {
            console.log(data)
        },
        error: function (xhr, ajaxOptions, thrownError) {
            alert(xhr.responseText);
            alert(thrownError);
        }
    });

}
function showDkm() {
    $('.cropupload').each(function () {
        var abc = $(this).CropUpload().getData();
    })
}
jQuery(function ($) {

    $('#iup').CropUpload({
        thumbSize: {w: 96, h: 96},
        previewSize: {w: 320, h: 320},
        onCropped: function (foo) {
        }
    });
    $('#iup2').CropUpload({
        color: 'red', thumbSize: {w: 96, h: 96}, previewSize: {w: 320, h: 320}
    });
})

json = function (data) {
    window.console.log(JSON.stringify(data));
}