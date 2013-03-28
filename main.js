
$(function() {

    var dfd = $.Deferred(),
        alb_photo;
    var $thumbs_height  = 90;
    var images = {},
        last_loaded_img;

    dfd.resolve();


    dfd
        .then(function () {
            return $.get("http://api-fotki.yandex.ru/api/users/aig1001/?format=json", {}, function (data) {
                alb_photo = data['collections']['album-list']['href'];
            }, 'jsonp');

        })
        .pipe(function () {
            return $.get(alb_photo + "/?format=json", {}, function (data) {
                alb_photo = data['links']['self'];
            }, 'jsonp');

        })
        .pipe(function () {
            return $.get(alb_photo, {}, function (data) {
                var a;
                jQuery.each(data['entries'], function () {
                    if (this['title'] == 'Кошкин дом') return a = this;
                });
//                console.log(a);
                alb_photo = a['links']['photos'];

            }, 'jsonp');

        })
        .pipe(function () {
            return $.get(alb_photo, {}, function (data) {
//                console.log(alb_photo);
//                console.log(data);
//                console.log(data['entries'].length-1);
                jQuery.each(data['entries'], function (i) {
                    i++;
                    $(images).data(''+i, { XXS: this['img']['XXS']['href'], L: this['img']['L']['href']});
                });
                var last_loaded = data['entries'].length-1;
                last_loaded_img = data['entries'][last_loaded]['updated'];
                console.log('1 '+getKeysCount($(images).data()));
            }, 'jsonp');

        }).pipe(function () {
             jQuery.each($(images).data(), function (i) {
                var path = this.XXS;
                $('.small').append('<a href="/"><img src="'+ path +'" alt="' + i +'" height="75" width="75"></a>');
            });
            var first_img,img_num;
            if (history.state){
                first_img = history.state.img;
                img_num = history.state.img_num;
//                console.log(history.state);
            }else{
                first_img = $(images).data('1').L;
                img_num = 1;
            }
            checkLastElem(img_num);
            changeCurrentThumb($('.small img[alt="'+ img_num +'"]'));
            return $('.current_img').html('<img src="'+ first_img +'" alt="'+ img_num +'">');
        });



    $('.small').hide();

    $('.small').on('click', 'a', function (event) {
        event.preventDefault();
        var this_img = $(this).find('img');
        var img_num = $(this_img).attr("alt"),
            old_num = $('.current_img img').attr("alt");

        changeCurrentThumb($(this_img));

        if(parseInt(img_num, 10) > parseInt(old_num, 10)){
            nextImg(img_num);
        }else{
            prevImg(img_num);
        }
    });

    $('a.prev').on('click', function (event) {
        event.preventDefault();

        var curr_img = $('.current_img').find('img'),
            curr_num = parseInt($(curr_img).attr("alt"), 10),
            prev_thumb = $('.small a')[curr_num],
            prev_num = curr_num + 1 + '';

        changeCurrentThumb($(prev_thumb).find('img'));

        prevImg(prev_num);
    });


    $('a.next').on('click', function (event) {
        event.preventDefault();

        var curr_img = $('.current_img').find('img'),
            curr_num = parseInt($(curr_img).attr("alt"), 10),
            next_thumb = $('.small a')[curr_num],
            next_num = curr_num + 1 + '';

        changeCurrentThumb($(next_thumb).find('img'));

        nextImg(next_num);
    });


    $('.small').bind('mousewheel DOMMouseScroll', function(e) {
        var scrollTo = null;
        if (e.type == 'mousewheel') {
            scrollTo = e.originalEvent.wheelDelta;
        }
        else if (e.type == 'DOMMouseScroll') {
            scrollTo = e.originalEvent.detail;
        }

        if (scrollTo > 0) {
            e.preventDefault();
            $('.small').animate({
                left: parseInt($('.small').css('left'), 10) <= ($('body').width() +$('body').width()/2) - $('.small').width() ?
                    $('body').width() - $('.small').width() :
                    '-='+$('body').width()/2
            }, {queue:false});
        }else{
            e.preventDefault();
                $('.small').animate({
                    left: parseInt($('.small').css('left'), 10) >= -$('body').width()/2 ?
                        0 :
                        '+='+$('body').width()/2
                }, {queue:false});
        }
    });

    $(document).mouseenter(function() {
        $('.wrapp > a').show();
    });
    $(document).mouseleave(function() {
        $('.wrapp > a').hide();
    });

    $(document).mousemove(function(e) {
        var distance = $('body').height() - $thumbs_height;
        if (e.pageY > distance){
            $('.small').slideDown();
        }else{
            $('.small').slideUp();
        }
    });

    $(window).resize(function() {
        imgSize($(".current_img"));
    });

    function imgSize(img) {
        if($('body').height() <= img.find('img').height()){
            img.height( $('body').height());
        }
        if ($('body').height() > img.find('img').height()){
            img.height('auto');
        }
        if ($('body').width() > img.find('img').width()){
            img.width('auto');
        }
        if ($('body').width() <= img.find('img').width()){
            img.width( $('body').width());
        }
    }

    function prevImg(elem_num) {
        $('.prev_img').html('<img src="'+ $(images).data(elem_num).L +'" alt="'+ elem_num +'">');
        $('.prev_img img').promise().done(slideRight());
        history.pushState({img: $(images).data(elem_num).L, img_num: elem_num}, '', '');
        checkLastElem(elem_num);
    }

    function nextImg(elem_num) {
        $('.next_img').html('<img src="'+ $(images).data(elem_num).L +'" alt="'+ elem_num +'">');
        $('.next_img img').promise().done(slideLeft());
        history.pushState({img: $(images).data(elem_num).L, img_num: elem_num}, '', '');
        checkLastElem(elem_num);
    }

    function checkLastElem(elem_num) {
        if(elem_num == getKeysCount($(images).data())){
            $('a.next').css({visibility:'hidden'});
            loadRestImg();
        }else if(elem_num == 1){
            $('a.prev').css({visibility:'hidden'});
        }else{
            $('a.prev, a.next').css({visibility:'visible'});
        }
    }

    function loadRestImg() {
        console.log('3 '+getKeysCount($(images).data()));

        var link_photo = alb_photo.substring(0, alb_photo.indexOf('?'));


        $.get(link_photo+'updated;'+last_loaded_img+'/?format=json', {}, function (data) {

            var i = getKeysCount($(images).data());
//            console.log(i);
            jQuery.each(data['entries'].slice(1, data['entries'].length-1), function () {
                i++;
//                console.log(i);
//                console.log(this['img']['XXS']['href']);
                $(images).data(''+i, { XXS: this['img']['XXS']['href'], L: this['img']['L']['href']});
                var path = this['img']['XXS']['href'];
                $('.small').append('<a href="/"><img src="'+ path +'" alt="' + i +'" height="75" width="75"></a>');
            });
            var last_loaded = data['entries'].length-1;
            return last_loaded_img = data['entries'][last_loaded]['updated'];
        }, 'jsonp');
    }

    function getKeysCount(obj) {
        var counter = 0;
        for (var key in obj) {
            counter++;
        }
        return counter;
    }


    function slideLeft() {

        $('.current_img').animate({
            left: -($('.current_img').outerWidth()*2)
        }, {
            "complete" : function() {
                $(this).remove();
            }
            });
        $('.next_img').animate({
            right: 0
        });
        $('.next_img').removeClass().addClass('current_img');
        $('.main ul').append('<li class="next_img"></li>');
        imgSize($('.current_img'));
    }

    function slideRight() {
        $('.current_img').animate({
            left: $('.current_img').outerWidth()*2
        }, {
            "complete" : function() {
                $(this).remove();
            }
        });
        $('.prev_img').animate({
            left: 0
        });
        $('.prev_img').removeClass().addClass('current_img');
        $('.main ul').append('<li class="prev_img"></li>');
        imgSize($('.current_img'));
    }


    function changeCurrentThumb(current) {
        $('.small img').removeClass('active');
        $(current).addClass('active');

        if($(current).offset().left > ($('body').width()/2)){
            $('.small').animate({
                left: parseInt($('.small').css('left'), 10) <= ($('body').width()+$('body').width()/2) - $('.small').width() ?
                    $('body').width() - $('.small').width() :
                    '-='+($(current).offset().left - $('body').width()/2 +$(current).width())
            }, {queue:false});

        }else{
            $('.small').animate({
                left: parseInt($('.small').css('left'), 10) >= -$('body').width()/2 ?
                    0 :
                    '+='+($('body').width()/2 - $(current).offset().left-$(current).width())
            }, {queue:false});

        }
    }

});
