$(document).ready(function(){
    var comut = new Comut();
    comut.init({
        target: '#widget',
    });
    $('<button>', { class: 'btn btn-default' }).text('Randomize').on('click', function () { comut.randomize(); }).appendTo('#test-buttons');
    $('<button>', { class: 'btn btn-default' }).text('Sort Samples').on('click', function () { comut.sort({ x: true }); }).appendTo('#test-buttons');
    $('<button>', { class: 'btn btn-default' }).text('Sort Genes').on('click', function () { comut.sort({ y: true }); }).appendTo('#test-buttons');
    $('<button>', { class: 'btn btn-default' }).text('Sort Both').on('click', function () { comut.sort(); }).appendTo('#test-buttons');
    $('button').css({ margin: '5px' });
    var exampleData = $('<div>').prependTo($('.load-data')).css({padding:'5px',border:'thin gray solid'});
    $('<div>').html('This demonstration contains example data with a small number of samples, and includes both genomic and demographic data.').appendTo(exampleData);
    $('<button>').text('Click here to load example data').on('click',function(){
    			$.ajax({
    				type:'GET',
    				url:'glio_variants.txt',
    				success:function(d,j,x){
    					comut.setData(d,null,'Example variant data');
    				},
					error:function(d){
						console.log('Error loading glio_variants.txt:', d);
					}    				
    			});
    			$.ajax({
    				type:'GET',
    				url:'glio_demog.txt',
    				success:function(d,j,x){
    					comut.setData(null,d,'Example demographic data');
    				},
					error:function(d){
						console.log('Error loading glio_demog.txt:', d);
					}    				
    			});
            
        }).appendTo(exampleData).css('margin-top','5px');
    
});