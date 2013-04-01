
$(function() {

    var dfd = $.Deferred(),
        alb_photo,
        images = {},
        last_loaded_img,
        $thumbs_height  = 90,
        $body = $('body'),
        $small = $('.small'),
        $prev_arr = $('.arrow-prev'),
        $next_arr = $('.arrow-next');

    dfd.resolve();


    //маштабирование картинки
    function imgSize(img) {
        if ($body.height() <= img.find('img').height()) {
            img.height($body.height());
        } else {
            img.height('auto');
        }

        if ($body.width() > img.find('img').width()) {
            img.width('auto');
        } else {
            img.width($body.width());
        }
    }

    //подсчет количества свойств в объекте
    function getKeysCount(obj) {
        var counter = 0, key;
        for (key in obj) {
            counter++;
        }
        return counter;
    }

    //является ли картинка последней или первой
    function checkLastElem(elem_num) {
        if (elem_num == getKeysCount($(images).data())) {
            $next_arr.css({visibility: 'hidden'});
            loadRestImg();
        } else if (elem_num == 1) {
            $prev_arr.css({visibility: 'hidden'});
        } else {
            $('.arrow-prev, .arrow-next').css({visibility: 'visible'});
        }
    }

    //анимация смены картики влево
    function slideLeft() {
        $('.main__current').animate({
            left: -($('.main__current').outerWidth() * 2)
        }, {
            "complete" : function() {
                $(this).remove();
            }
        });
        $('.main__next').animate({
            right: 0
        });
        $('.main__next').removeClass().addClass('main__current');
        $('.main ul').append('<li class="main__next"></li>');
        imgSize($('.main__current'));
    }

    //анимация смены картинки вправо
    function slideRight() {
        $('.main__current').animate({
            left: $('.main__current').outerWidth()*2
        }, {
            "complete" : function() {
                $(this).remove();
            }
        });
        $('.main__prev').animate({
            left: 0
        });
        $('.main__prev').removeClass().addClass('main__current');
        $('.main ul').append('<li class="main__prev"></li>');
        imgSize($('.main__current'));
    }

    //отображаем предыдущую картинку, сохраняем ее с помощью history api, либо localStorage
    function prevImg(elem_num) {
        $('.main__prev').html('<img src="' + $(images).data(elem_num).L + '" alt="' + elem_num + '">')
                      .find('img').promise().done(slideRight());

        var image = $(images).data(elem_num).L;
        if (history.pushState) {
            history.pushState({img: $(images).data(elem_num).L, img_num: elem_num}, '', '');
        } else {
            localStorage.setItem('img_url', image);
            localStorage.setItem('img_num', elem_num);
        }
        checkLastElem(elem_num);
    }

    //отображаем следующую картинку, сохраняем ее с помощью history api, либо localStorage
    function nextImg(elem_num) {
        $('.main__next').html('<img src="' + $(images).data(elem_num).L + '" alt="' + elem_num + '">')
                      .find('img').promise().done(slideLeft());

        var image = $(images).data(elem_num).L;
        if (history.pushState) {
            history.pushState({img: $(images).data(elem_num).L, img_num: elem_num}, '', '');
        } else {
            localStorage.setItem('img_url', image);
            localStorage.setItem('img_num', elem_num);
        }
        checkLastElem(elem_num);
    }

    //центрирование текущей превью
    function centerCurrent(current) {
        var $body_width = $body.width(),
            $small_width = $small.width(),
            $curr_offset = $(current).offset().left;
        if ($curr_offset > ($body_width / 2)) {
            $small.animate({
                left: parseInt($small.css('left'), 10) <= ($body_width + $body_width / 2) - $small_width ? $body_width - $small_width : '-=' + ($curr_offset - $body_width / 2 + $(current).width())
            }, {queue: false});
        } else {
            $small.animate({
                left: parseInt($small.css('left'), 10) >= -$body_width / 2 ? 0 : '+=' + ($body_width / 2 - $curr_offset - $(current).width())
            }, {queue: false});
        }
    }

    //добавление класса 'small--active' текущей превью
    function changeCurrentThumb(current) {
        $('.small img').removeClass('small--active');
        $(current).addClass('small--active');
        centerCurrent(current);
    }

    //подгрузка следующих картинок из текущего альбома, начиная с последней загруженной
    function loadRestImg() {
        var link_photo = alb_photo.substring(0, alb_photo.indexOf('?'));

        $.get(link_photo + 'updated;' + last_loaded_img + '/?format=json', {}, function (data) {
            var i = getKeysCount($(images).data()),
                $data_arr = data.entries,
                last_loaded = $data_arr[$data_arr.length - 1];

            $.each($data_arr.slice(1, $data_arr.length), function () {
                i++;
                $(images).data('' + i, { XXS: this.img.XXS.href, L: this.img.L.href});
                $small.append('<a href="/"><img src="' + this.img.XXS.href + '" alt="' + i + '" height="75" width="75"></a>');
            });

            //отобразить стрелки если элемент не последний
            if ($data_arr.length > 1) {
                $next_arr.css({visibility: 'visible'});
            }

            //возвращаем дату обновления последней загруженной картинки
            return last_loaded_img = last_loaded.updated;
        }, 'jsonp');
    }



    dfd
        //выбираем из коллекций пользователя "aig1001" ссылку на коллекцию альбомов
        .then(function () {
            return $.get("http://api-fotki.yandex.ru/api/users/aig1001/?format=json", {}, function (data) {
                alb_photo = data.collections['album-list'].href;
            }, 'jsonp');

        })

        //выбираем ссылку на коллекцию картинок альбома "Кошкин дом"
        .pipe(function () {
            return $.get(alb_photo + "/?format=json", {}, function (data) {
                var a;
                $.each(data.entries, function () {
                    if (this.title === 'Кошкин дом') {
                        return a = this;
                    }
                });
                alb_photo = a.links.photos;
            }, 'jsonp');

        })

        //записываем в объект "images" ссылки на картинки
        .pipe(function () {
            return $.get(alb_photo, {}, function (data) {
                var $data_arr = data.entries,
                    last_loaded = $data_arr[$data_arr.length - 1];
                $.each($data_arr, function (i) {
                    i++;
                    $(images).data('' + i, { XXS: this.img.XXS.href, L: this.img.L.href});
                });

                //записываем дату обновления последней загруженной картинки, чтобы с нее начать подгрузку остальных
                last_loaded_img = last_loaded.updated;
            }, 'jsonp');

            //заполняем панель превью фотографий

        }).pipe(function () { $.each($(images).data(), function (i) { var path = this.XXS; $small.append('<a href="/"><img src="' + path + '" alt="' + i + '" height="75" width="75"></a>');
            });

            //показываем последнюю активную фотографию с помощью history API, либо localStorage
            var first_img, img_num;

            if (history.state !== null && history.pushState) {
                first_img = history.state.img;
                img_num = history.state.img_num;
            } else if (!history.pushState && localStorage.length > 0) {
                first_img = localStorage['img_url'];
                img_num = localStorage['img_num'];
            } else {
                first_img = $(images).data('1').L;
                img_num = 1;
            }

            checkLastElem(img_num);
            changeCurrentThumb($('.small img[alt="' + img_num + '"]'));

            return $('.main__current').html('<img src="' + first_img + '" alt="' + img_num + '">'); });


    $small.hide();

    //листаем фото вправо или влево (в зависимости от положения предыдущей фотографии) при клике превью
    $small.on('click', 'a', function (event) {
        event.preventDefault();

        var this_img = $(this).find('img'),
            img_num = $(this_img).attr("alt"),
            old_num = $('.main__current img').attr("alt");

        changeCurrentThumb($(this_img));

        if (parseInt(img_num, 10) > parseInt(old_num, 10)) {
            nextImg(img_num);
        } else {
            prevImg(img_num);
        }
    });

    //отображение предыдущей фотографии
    $prev_arr.on('click', function (event) {
        event.preventDefault();

        var curr_img = $('.main__current').find('img').attr("alt"),
            prev_num = parseInt(curr_img, 10) - 1 + '',
            prev_thumb = $small.find('img[alt="' + prev_num + '"]');

        changeCurrentThumb($(prev_thumb));

        prevImg(prev_num);
    });

    //отображение следующей фотографии
    $next_arr.on('click', function (event) {
        event.preventDefault();

        var curr_img = $('.main__current').find('img').attr("alt"),
            next_num = parseInt(curr_img, 10) + 1 + '',
            next_thumb = $small.find('img[alt="' + next_num + '"]');

        changeCurrentThumb($(next_thumb));

        nextImg(next_num);
    });

    //если колесо мышки скролится вверх, то двигаем панель превью влево, если скролл вниз, то двигаем вправо
    $small.bind('mousewheel DOMMouseScroll', function(e) {
        var scrollTo = null,
            $body_width = $body.width();

        if (e.type === 'mousewheel') {
            scrollTo = e.originalEvent.wheelDelta;
        } else if (e.type === 'DOMMouseScroll') {
            scrollTo = e.originalEvent.detail;
        }

        if (scrollTo > 0) {
            e.preventDefault();
            $small.animate({
                left: parseInt($small.css('left'), 10) <= ($body_width + $body_width / 2) - $small.width() ? $body_width - $small.width() : '-=' + $body_width / 2
            }, {queue: false});
        } else {
            e.preventDefault();
            $small.animate({
                left: parseInt($small.css('left'), 10) >= -$body_width / 2 ? 0 : '+=' + $body_width / 2
            }, {queue: false});
        }
    });

    //показываем, скрываем стрелки(справа, слева)
    $(window).mouseenter(function() {
        $('.wrapp > a').show();
    });

    $(window).mouseleave(function() {
        $('.wrapp > a').hide();
    });

    //показываем, скрываем панель превью при приблежении курсора к области панели
    $(window).mousemove(function(e) {
        var distance = $body.height() - $thumbs_height;

        if (e.pageY > distance) {
            $small.slideDown();
        } else {
            $small.slideUp();
        }
    });

    //центрируем активное изображение при наведении на панель превью
    $small.mouseenter(function() {
        centerCurrent($('.small--active'));
    });

    //масштабируем картинку при изменении размера окна
    $(window).resize(function() {
        imgSize($(".main__current"));
    });

});
