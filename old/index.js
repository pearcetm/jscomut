
    var comut = new Comut();
    comut.init({
        target: '#widget',
    });
    $('<button>', { class: 'btn btn-default' }).text('Randomize').on('click', function () { comut.randomize(); }).appendTo('#test-buttons');
    $('<button>', { class: 'btn btn-default' }).text('Sort Samples').on('click', function () { comut.sort({ x: true }); }).appendTo('#test-buttons');
    $('<button>', { class: 'btn btn-default' }).text('Sort Genes').on('click', function () { comut.sort({ y: true }); }).appendTo('#test-buttons');
    $('<button>', { class: 'btn btn-default' }).text('Sort Both').on('click', function () { comut.sort(); }).appendTo('#test-buttons');
    $('button').css({ margin: '5px' });
