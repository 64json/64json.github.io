$(window).load(function () {
    $('.se-pre-con').fadeOut('slow');

    var z_index = 0;
    var relocate = function (row, col, xh, xw, mh, mw) {
        var $fake_cell = $('.fake-row:eq(' + row + ') .fake-col:eq(' + col + ')');
        var offset = $fake_cell.offset();
        var cell = '.cell' + (row + 1) + '' + (col + 1);
        $(cell).css({
            'width': $fake_cell.width(),
            'height': $fake_cell.height(),
            'top': offset.top,
            'left': offset.left,
            'flex-flow': xh > 1 ? 'column' : 'row'
        });
        $(cell + ' .icon').css({
            'width': $fake_cell.width(),
            'height': $fake_cell.height(),
            'background-size': xh > 1 ? '50% auto' : 'auto 50%'
        });
        $(cell).hover(function () {
            $(cell).css('z-index', ++z_index);
            $(cell).animate({
                'width': $fake_cell.width() * xw,
                'height': $fake_cell.height() * xh,
                'margin-left': $fake_cell.height() * mw,
                'margin-top': $fake_cell.height() * mh
            }, {queue: false, duration: 500});
        }, function () {
            $(cell).animate({
                'width': $fake_cell.width(),
                'height': $fake_cell.height(),
                'margin-left': 0,
                'margin-top': 0
            }, {queue: false, duration: 500});
        });
    };
    var relocateAll = function () {
        relocate(0, 0, 2, 1);
        relocate(0, 1);
        relocate(0, 2, 2, 1);
        relocate(1, 0);
        relocate(1, 1, 3, 1, -1);
        relocate(1, 2);
        relocate(2, 0, 2, 1, -1);
        relocate(2, 1);
        relocate(2, 2, 1, 2, 0, -1);
    };
    var onResize = function () {
        var width = $(window).width();
        var height = $(window).height();
        var min = (width < height ? width : height) - 16;
        $('.fake-grid').animate({
            'width': min,
            'height': min,
            'top': (height - min) / 2,
            'left': (width - min) / 2
        }, 0, null, function () {
            relocateAll();
        });
    };
    onResize();
    $(window).resize(onResize);

    var months = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    $('#today').text(months[month] + ' ' + day + ', ' + year);

    $('.career-section').click(function () {
        $(this).toggleClass('active');
    })
});