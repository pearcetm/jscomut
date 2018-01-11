function Comut() {
    var _this = this;
    var mutTypeEncoding = {}; //will be set during initialization, but declare here for scope.
	
    // https://github.com/wbkd/d3-extended
    d3.selection.prototype.moveToFront = function () {
        return this.each(function () {
            this.parentNode.appendChild(this);
        });
    };
    d3.selection.prototype.moveToBack = function () {
        return this.each(function () {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                this.parentNode.insertBefore(this, firstChild);
            }
        });
    };
    _this.data = { samples:[], genes:[], cells: [] };
    _this.demo = { headers:[], fields:[], cells: [] };
    _this.default_options = {
        target: '',
        
        grid: {
            cellwidth: 20,
            cellheight: 30,
            maxgridwidth:500,
            padding:1,
        },
        bar: {
            width: 200,
            //height: same as grid because the data is the same
        },
        geneLegend: {
            width: 70,
        },
        sampleLegend:{
            
            height: 100,
            show:'yes',//if not 'yes' a scale of zero will hide the labels
        },
        colorLegend:{
            width:200,
        },
        innerLayout:{
            margins:5,
        },        
        legendOrder: [
                'missense',
	        'stop',
		'fs',
		'inframe',
		'splice',
		'amp',
		'del',
		'fusion',
		'wt',
        ],
	mutTypeEncoding: {
	    "wt": { "code": 0, "color": "#D4D4D4", "text": "No alteration" },
	    "missense": { "code": 1, "color": "#0F8500", "text": "Missense" },
	    "stop": { "code": 2, "color": "#000000", "text": "Stop gain" },
	    "fs": { "code": 3, "color": "#5E2700", "text": "Frameshift" },
	    "inframe": { "code": 4, "color": "#C973FF", "text": "Inframe" },
	    "splice": { "code": 5, "color": "#F57564", "text": "Splice site" },
	    "amp": { "code": 6, "color": "#2129FF", "text": "Amplification" },
	    "del": { "code": 7, "color": "#FF0000", "text": "Deletion/loss" },
	    "fusion": { "code": 8, "color": "#00BFFF", "text": "Fusion" }
	},
        
        dataInput: {
            filePicker: true,//if true, adds a button to select a file
            pasteBox:true,//if true, adds a textinput for copy/paste
        }
    };
    _this.mode = {
        interaction: 'none'
    };
    
    this.init = function (options) {
        
        
        _this.options = $.extend(true, {}, _this.default_options, options);
        var options = _this.options;
	mutTypeEncoding = options.mutTypeEncoding;
	    
        if (options.target && $(options.target).length ==1 ) {
            _this.widget = $(options.target);
        }
        else {
            _this.widget = $('<div>', { class: 'comut' }).hide().appendTo('body');
        }
        _this.d3widget = d3.select(_this.widget[0]);

        var ctrls = $('<div>', { class: 'comut-ctrls' }).appendTo(widget);
        _this.setData=function(m,d){
			  processMutationData(m);
			  processDemographicData(d);
		  };
        var cfgbutton = $('<button>', { class: 'btn btn-default' }).text('Configure widget').on('click', function () { config.show(); $(this).hide(); }).appendTo(ctrls);
        var config = $('<div>',{class:'jscomut-config'}).appendTo(ctrls).hide();
        var mutationFileInfo = $('<div>', { id:'mutation-file-info', class: 'config-group' }).appendTo(config);//.append($('<h3>').text('Genomic data'));
        var demographicsFileInfo = $('<div>', { id:'demographics-file-info', class: 'config-group' }).appendTo(config);//.append($('<h3>').text('Demographic data'));
         
	if (options.dataInput.filePicker == true) {
            $('<label>', { for: 'mfile' }).text('Select mutation file').appendTo(mutationFileInfo);
            _this.filePickerM = $('<input>', { type: 'file', class: 'comut-file-picker', id: 'mfile' }).appendTo(mutationFileInfo).on('change', function (e) {
                loadMutationFile(e);
            });
            $('<label>', { for: 'dfile' }).text('Select demographics/annotation file').appendTo(demographicsFileInfo);
            _this.filePickerD = $('<input>', { type: 'file', class: 'comut-file-picker', id: 'dfile' }).appendTo(demographicsFileInfo).on('change', function (e) {
                loadDemographicsFile(e);
            });
        }
        if(options.dataInput.pasteBox == true){
            _this.pasteBoxM = $('<input>', { type: 'text', class: 'comut-paste-box', placeholder: 'Paste mutation data here' }).appendTo(mutationFileInfo)
                .on('paste', function (e) {
                    clipboardData = e.originalEvent.clipboardData || window.originalEvent.clipboardData;
                    pastedData = clipboardData.getData('text');
                    processMutationData(pastedData);
                     
                    $(this).val('');
                    return false;
                });
            _this.pasteBox = $('<input>', { type: 'text', class: 'comut-paste-box', placeholder: 'Paste demographic data here' }).appendTo(demographicsFileInfo)
                .on('paste', function (e) {
                    clipboardData = e.originalEvent.clipboardData || window.originalEvent.clipboardData;
                    pastedData = clipboardData.getData('text');
                    processDemographicData(pastedData);
                     
                    $(this).val('');
                    return false;
                });
        }
        $('<br>').appendTo(config);
        
        $('<h4>').text('Select demographics fields to plot:').appendTo(demographicsFileInfo);
        var demographicFields = $('<div>', { id: 'demographics-fields' }).appendTo(demographicsFileInfo);
        
        $('<button>', { class: 'btn btn-default' }).text('Create widget').on('click', function () {
            config.hide();
            cfgbutton.show();
            updateOptions();
            configureWidget();
            drawData();
        }).appendTo(config);
        var downloadOverlay = $('<div>').appendTo('body').css({position:'fixed',left:0,right:0,top:0,bottom:0,'background-color':'black',opacity:'0.6'}).on('click',function(){
            $(this).hide();
        }).hide().append($('<div>').css({
            'background-color': 'white',
            position: 'fixed',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '1em',
            opacity:'1',
        }).append(
            $('<a>', { class: 'svg-download', download: 'comut.svg' }).text('SVG file: click to download')));
        $('<button>', { class: 'btn btn-default' }).text('Create downloadable svg file').on('click', function () {
            var svgstring = '<?xml version="1.0" standalone="no"?>\
            <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\
            <svg xmlns="http://www.w3.org/2000/svg">' + $('#comut-svg').html() + "</svg>";
            var href = makeFile(svgstring);
            downloadOverlay.find('.svg-download').attr('href', href);
            downloadOverlay.show();
            
        }).appendTo(ctrls);
        
        var mode_ctrls = $('<div><fieldset style="border:thin grey solid;padding:5px;border-radius:5px;display:inline-block;">\
                            <legend style="margin-bottom:5px;width:auto;">Interactive mode:</legend>\
                            <button id="radio-dnd" data-mode="dnd" class="btn btn-default">Drag-and-drop</button>\
                            <button id="radio-zp" data-mode="zp" class= "btn btn-default">Pan and zoom</button>\
                            <button id="radio-none" data-mode="none" class = "btn btn-default btn-primary">None</button>\
                          </fieldset></div>').appendTo(ctrls);
        mode_ctrls.find('button').on('click', function () {
            _this.mode.interaction = $(this).data('mode');
            $(this).addClass('btn-primary').siblings().removeClass('btn-primary');
            _this.svg.attr('interaction', _this.mode.interaction);
        });
        
        var w = options.bar.width + options.geneLegend.width + options.grid.cellwidth + options.innerLayout.margins * 3 + options.colorLegend.width;
        var h = options.grid.cellheight + options.sampleLegend.height+options.innerLayout.margins;
        var o = options.sampleLegend.height + options.innerLayout.margins;
        var g = options.grid;

        _this.tooltip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(function (d) {
              var div = $('<div>');
              
              var celldata = d.celldata;
              if (!celldata) {
                  celldata = { 'Sample': d.sample, 'Gene': d.gene };
              }
              $.each(celldata, function (k, v) {                      
                    $('<span>', { class: 'tooltip-key' }).appendTo(div).text(k);
                    $('<span>', { class: 'tooltip-value' }).appendTo(div).text(v);
                    $('<br>').appendTo(div);
                });
              
              
              $('<br>').appendTo(div);

              return div.html();
          });

        _this.svg = _this.d3widget
            .append('svg')
            .attr('id','comut-svg')
            .attr('width', w)
            .attr('height', h);

        _this.svg.call(_this.tooltip);

        _this.zoom = d3.zoom().scaleExtent([1, 4])
            .on('zoom', zoomed)
            .on('start', function () {
                _this.scales.gridX.translateX = d3.event.transform.x;
            })
            .filter(function () { return _this.mode.interaction == 'zp'; });

        _this.drag = d3.drag()
                .on('start', gridDragStart)
                .on('drag', gridDrag)
                .on('end', gridDragEnd)
                .filter(function () { return _this.mode.interaction == 'dnd'; });

        mode_ctrls.find('#radio-none').click(); //do this after zoom and drag object are created
        _this.gridholder = _this.svg.append('g')
            .attr('transform', 'translate(' + (options.bar.width + options.geneLegend.width + options.innerLayout.margins * 2) + ',0)');
        
        _this.zoomable = _this.gridholder.append('g')
            .attr('clip-path', 'url(#zoomable-clip)')
            .call(_this.zoom);

        _this.zoomableClip = _this.zoomable.append('clipPath').attr('id', 'zoomable-clip')
            .append('rect').attr('width', 0).attr('height', 0);

        _this.grid=_this.zoomable
            .append('g')
            .attr('class', 'grid')
            .attr('transform', 'translate(0,' + o + ')');

        _this.demographics = _this.zoomable
            .append('g')
            .attr('class', 'demographics')
            .attr('transform', 'translate(0,' + o + ')');

        _this.grid.append('rect')
            .attr('class', 'zoom-rect')
            .attr('width', 0)
            .attr('height', 0)
            .attr('stroke', 'none')
            .attr('fill','blue')
            .attr('fill-opacity',0.0);

        _this.bar = _this.svg
            .append('g')
            .attr('transform', 'translate(' + options.bar.width + ',' + o + ')')
            .append('g')
            .attr('class', 'bar');

        _this.geneLegend = _this.svg
            .append('g')
            .attr('class', 'gene-legend')
            .attr('transform', 'translate(' + (options.bar.width + options.innerLayout.margins) + ',' + (o) + ')');
        
        _this.demoTitles = _this.svg
            .append('g')
            .attr('class', 'demo-titles')
            .attr('transform', 'translate(' + (options.bar.width + options.geneLegend.width) + ',' + (g.cellheight + o) + ')');
        _this.demoLegend = _this.gridholder
            .append('g')
            .attr('class', 'demo-legend');

        _this.sampleLegend = _this.zoomable
            .append('g')
            .attr('class', 'sample-legend')
            .attr('transform', 'translate(0,' + (o-options.innerLayout.margins) + ')' +
            ' scale(1,' + (options.sampleLegend.show=='yes'?1:0) + ')');

        _this.colorLegend = _this.svg
            .append('g')
            .attr('class', 'color-legend');
        _this.scales={};

        function drawData() {
            _this.grid.selectAll('.cell').data([]).exit().remove();
            _this.demographics.selectAll('.cell').data([]).exit().remove();
            _this.geneLegend.selectAll('.gene').data([]).exit().remove();
            _this.bar.selectAll('.gene').data([]).exit().remove();
            _this.demoTitles.selectAll('.fieldname').data([]).exit().remove();
            _this.demoLegend.selectAll('.demolegend').data([]).exit().remove();
            _this.sampleLegend.selectAll('.sample').data([]).exit().remove();

            var data = _this.data;
            
            _this.grid
                .selectAll('.cell')
                .data(data.cells)
                .enter()
                .append('g')
                .attr('class', 'cell  draggable-xy')
                .attr('transform', function (d) {
                	var e = d3.select(this);
                	var x = _this.scales.gridX(d.sample);
                	var y = _this.scales.gridY(d.gene);
                	e.attr('gx',x);
                	e.attr('gy',y);
                    return 'translate(' + x + ','+ y + ')';
                })
                .each(function(d){
                	//add visual elements representing alterations
					    
					    if(d.alterations.length==0){
					    	 var type = 'wt';
					    	 d3.select(this).append('svg:rect')
						    	.attr('width',_this.scales.gridX.bandwidth())
						    	.attr('height',_this.scales.gridY.bandwidth())
						    	.style('fill',_this.scales.gridC(type))
						}
						
						else{
							var g = d3.select(this);
							var alt = d.alterations.sort(function(a,b){
								return mutTypeEncoding[a.type] - mutTypeEncoding[b.type];
							});
							for(var i = 0; i<alt.length;++i){
								g.append('svg:rect')
									.attr('width',_this.scales.gridX.bandwidth())
									.attr('height',_this.scales.gridY.bandwidth()/alt.length)
									.attr('y',_this.scales.gridY.bandwidth()/alt.length *i )
									.style('fill',_this.scales.gridC(alt[i].type));
								if(i>0 && alt[i].type==alt[i-1].type){
									//add a white line between the two elements
									g.append('svg:rect')
										.attr('width',_this.scales.gridX.bandwidth())
										.attr('x',_this.scales.gridX.bandwidth()*0)
										.attr('height',1)
										.attr('y',_this.scales.gridY.bandwidth()/alt.length * i-0.5)
										.attr('fill','white');
								}
							}
						}
				    })
                .on('mouseover', _this.tooltip.show)
                .on('mouseout', _this.tooltip.hide)		
                .call( _this.drag );
	    
            _this.demographics
                .selectAll('.cell')
                .data(_this.demo.cells)                
                //.exit().remove()
                .enter()
                .filter(function (d) {
                    return _this.demofields.indexOf(d.fieldname) != -1 && _this.data.samples.map(function(x){return x.key;}).indexOf(d.sample)!=-1;
                })
                .append('svg:rect')
                .attr('class', 'cell  draggable-xy')
                .attr('x', function (d) {
                    return _this.scales.gridX(d.sample);
                })
                .attr('y', function (d) {
                    return _this.scales.demographicsY(d.fieldname);
                })
                .attr('width', function (d) {
                    return _this.scales.gridX.bandwidth();
                })
                .attr('height', function (d) {
                    return _this.scales.demographicsY.bandwidth();
                })
                .style('fill', function (d) {
                    //console.log(cScale(d.values[0].value));
                    return _this.scales.demoC[d.fieldname](d.value);
                })
                .on('mouseover', _this.tooltip.show)
                .on('mouseout', _this.tooltip.hide)
                .call(_this.drag);

            
            var bar_enter = _this.bar.selectAll('.gene')
                .data(data.alteration_count)
                .enter()
                .append('g')
                .attr('class', 'gene')
                .attr('transform', function (d) {
                    return 'translate(-'+_this.scales.barX(d.value)+','+_this.scales.gridY(d.key)+')';
                });
            bar_enter.append('svg:rect')
                .attr('width', function (d) {
                    return _this.scales.barX(d.value);
                })
                .attr('height', function (d) {
                    return _this.scales.gridY.bandwidth();
                });
            bar_enter.append('svg:text')
                .attr('x', -5)
                .attr('text-anchor', 'end')
                .attr('y', 1+_this.scales.gridY.bandwidth() / 2)
                .attr('dominant-baseline', 'middle')
                .text(function (d) { return (d.value / _this.data.samples.length * 100).toFixed(0) + '%'; });

            _this.geneLegend.selectAll('.gene')
                .data(data.genes)
                .enter()
                .append('svg:text')
                .attr('class', 'gene')
                .attr('y', function (d) {
                    return _this.scales.gridY(d.key) + _this.scales.gridY.bandwidth() / 2;
                })
                .text(function (d) { return d.key; })
                .attr('dominant-baseline', 'middle');

            _this.demoTitles.selectAll('.fieldname')
                .data(_this.demo.headers)
                .enter()
                .filter(function (d) {
                    return _this.demofields.indexOf(d) != -1;
                })
                .append('svg:text')
                .attr('class', 'fieldname')
                .attr('y', function (d) {
                    return _this.scales.demographicsY(d) + _this.scales.demographicsY.bandwidth() / 2;
                })
                .text(function (d) { return d; })
                .attr('dominant-baseline', 'center')
                .attr('text-anchor', 'right');
            var trs = getTranslation(_this.demoTitles.attr('transform'));
            trs[0] = trs[0] - _this.demoTitles.node().getBBox().width;
            _this.demoTitles.attr('transform', 'translate(' + trs[0] + ',' + trs[1] + ')');
            
            _this.demoLegend.selectAll('.demolegend')
                .data(_this.demo.headers)
                .enter()
                .filter(function (d) {
                    return _this.demofields.indexOf(d) != -1;
                })
                .append('g')
                .attr('class', 'demolegend')
                .attr('transform', function (d) {
                    return 'translate(0,' + (_this.scales.demographicsY(d)) + ')';
                })
                .each(function (d, i, g) {
                     
                    var offset = g[i].getBoundingClientRect().left;
                    d3.select(g[i]).call(_this.scales.demoC[d].legend);
                    d3.select(g[i])
                        .selectAll('.cell').each(function (d, i, g) {
                            var e = d3.select(g[i]);
                            var t = getTranslation(e.attr('transform'));
                            var current_left = g[i].getBoundingClientRect().left;			    
                            var left = i > 0 ? g[i - 1].getBoundingClientRect().right + 10 : offset;
                            e.attr('transform', 'translate(' + (t[0] + left - current_left) + ',' + 0 + ')');
                        });
                });
            _this.sampleLegend.selectAll('.sample')
                .data(data.samples)
                .enter()
                .append('g')
                .attr('class', 'sample')
                .attr('transform', function (d) {
                    return 'translate(' +(_this.scales.gridX(d.key) + _this.scales.gridX.bandwidth() / 2)+',0)';
                })
                .append('svg:text')
                .text(function (d) { return d.key; })
                .attr('alignment-baseline', 'middle')
                .attr('transform', 'rotate(-90)');
            
            _this.zoom.scaleTo(_this.grid, _this.zoom.scaleExtent()[0]);
            _this.sort();
        }

        function zoomed() {
            
            var t = d3.event.transform;
            _this.scales.gridX = rescaleOrdinalX(_this.scales.gridX, t);
            draw(0);
             
        }

        function loadMutationFile(e) {
            var f = e.target.files[0];
            if (!f) return;
            var reader = new FileReader();
            reader.onload = function () {
                processMutationData(reader.result);                
            };
            reader.readAsText(f);
        }
        function loadDemographicsFile(e) {
            var f = e.target.files[0];
            if (!f) return;
            var reader = new FileReader();
            reader.onload = function () {
                processDemographicData(reader.result);                
            };
            reader.readAsText(f);
        }
        function processMutationData(d) {
        	
        	var inputGenomicData = d.trim();
        	var delimiter = '\t';
        	//Step 1: Parse input genomic data from text box or flat file input (tab delimited) and convert into an array of JSON objects
		    var inputDataObject = textToJson(inputGenomicData, delimiter);
		    if (inputDataObject == false) {
		        return false;
		    }
		
		    //Step 2: get list of unique gene names across the sample dataset
		    var uniqGeneList = getGeneList(inputDataObject);
		
		    //Step 3: order this gene list in descending order of frequency of alterations in a gene
		    var sortedGeneAltFreq = orderGeneList(uniqGeneList, inputDataObject);
		
		    //Step 4: get unique list of samples from the dataset
		    var uniqSampleList = getSampleList(inputDataObject);
		
		    //Step 5: create 2D array containing genomic alteration status of each gene in the dataset for a given sample
		    var mutMatrix = createSampleMutationArray(inputDataObject, sortedGeneAltFreq, uniqSampleList);
		
		    //Step 6: create modified input genomic data list to accomodate genes for a sample that have no alterations
		    var completeGenomicData = populateNegatives(inputDataObject, uniqSampleList, uniqGeneList);
		
		    //Step 7: sort the mutation matrix recursively descending to get sample order
		    var sortedSampleList = sortMutMatrix(mutMatrix);
		    
		    

            _this.data = {};
            _this.data.sortedGenes = sortedGeneAltFreq;
            _this.data.genes = sortedGeneAltFreq.map(function(e){ return {key:e[0], }; });
            _this.data.cells = completeGenomicData;
            _this.data.sortedSamples = sortedSampleList;
            _this.data.samples = sortedSampleList.map(function(e){ return {key: e, }; }); 
            _this.data.mutMatrix = mutMatrix;
            _this.data.mutMatrixSampleOrder = mutMatrix.map(function(e){return e[e.length-1]; });
            _this.data.mutMatrixGeneOrder = sortedGeneAltFreq.map(function(e){ return e[0] });
            
            _this.data.alteration_count = sortedGeneAltFreq.map(function (e) {
                return { key: e[0], value: e[1] };
            });
            
            setupMutationConfig();
        }
        function processDemographicData(d) {
            var arr = d.trim().split(/\r\n|\r|\n/).map(function (e, i) {
                return e.trim().split(/\t/);
            });
            var headers = arr[0];
            
            var fieldMap = {};
            headers.forEach(function (e, i) { fieldMap[e] = { field: e.toLowerCase(), index: i, values:[] }; });
            arr = arr.filter(function (e, i) {
                return i > 0;
            }).map(function (e, i) {
                var row = {
                    celldata: {}
                };
                
                $.each(fieldMap, function (k, v) {
                    row[v.field] = e[v.index];
                    row.celldata[k] = e[v.index];
                });
                return row;
            });
            var cells = [];
            arr.forEach(function (e, i) {
                $.each(fieldMap, function (k, v) {
                    cells.push({ fieldname: k, sample: e.sample, value: e[v.field], celldata: e.celldata });
                });
                $.each(e.celldata, function (k, v) {
                    fieldMap[k].values.push(v);
                });
                
            });
            
            
            _this.demo = {};
            _this.demo.samples = d3.nest().key(function (d) { return d.sample; }).entries(arr);
            _this.demo.headers = headers;
            _this.demo.fields = fieldMap;
            _this.demo.cells = cells;
            
            setupDemographicsConfig();
        }
        function configureWidget() {
            var options = _this.options,
                g = options.grid,
                dh = (g.cellheight + g.padding) * options.demographics.length,
                gw = (g.cellwidth + g.padding) * _this.data.samples.length,
                gh = (g.cellheight + g.padding) * _this.data.genes.length,
                o = options.sampleLegend.height + options.innerLayout.margins,
                h = gh + dh + g.cellheight + o;
            _this.scaleExtent = [1, 2];
            if (gw > g.maxgridwidth) {               
                gw = g.maxgridwidth;                
                _this.scaleExtent[0] = g.maxgridwidth / gw;
            }
            _this.zoom.scaleExtent(_this.scaleExtent);
            var w = options.bar.width + options.geneLegend.width + gw + options.innerLayout.margins * 3 + g.cellwidth + options.colorLegend.width;

            _this.gridsize = { width: gw, height: gh };
            _this.svg.attr('width', '100%').attr('height',h).attr('viewBox', '0 0 '+w+' '+h).attr('preserveAspectRatio','xMinYMin');
            _this.zoomableClip.attr('width', gw).attr('height', gh + dh +g.cellheight + o);
            _this.zoomable.select('.zoom-rect').attr('height', gh).attr('width', gw);
            _this.scales.gridX = d3.scaleBand().domain(_this.data.sortedSamples).range([0, gw])
                                               .paddingInner(_this.options.grid.padding / _this.options.grid.cellwidth);
            _this.scales.gridY = d3.scaleBand().domain(_this.data.genes.map(function (x) { return x.key; })).range([0, gh])
                                               .paddingInner(_this.options.grid.padding / _this.options.grid.cellheight);
            _this.scales.demographicsY = d3.scaleBand().domain($.map(_this.options.demographics, function (x, k) { return x.field; })).range([0, dh])
                                               .paddingInner(_this.options.grid.padding / _this.options.grid.cellheight);
            _this.demographics.attr('transform', 'translate(0,' + (gh + g.cellheight + o) + ')');
            _this.demoTitles.attr('transform', 'translate(' +(options.bar.width + options.geneLegend.width-5) +',' + (gh + g.cellheight + o) + ')');
            
	    //convert the mutTypeEncoding keys and colors into matched arrays to create the color scale
	    var colorCodes = Object.keys(options.mutTypeEncoding);
            var colors = colorCodes.map(function (k) {
                return options.mutTypeEncoding[k].color;
            });
            _this.scales.gridC = d3.scaleOrdinal().domain(colorCodes).range(colors);
		
	    //convert the mutTypeEncoding colors and text to arrays in the order defined by options.legendOrder
            var legendColors = $.map(options.legendOrder, function(v){ return options.mutTypeEncoding[v].color; });
            var legendText = $.map(options.legendOrder, function(v){ return options.mutTypeEncoding[v].text; });
            
	    _this.scales.legendColor = d3.scaleOrdinal().domain(legendText).range(legendColors);
            _this.scales.barX = d3.scaleLinear().domain([0, Math.max.apply(null, _this.data.alteration_count.map(function (x) { return x.value; })) * 1.25]).range([0, options.bar.width]);
            _this.legend = d3.legendColor().orient('vertical').shapeWidth(options.grid.cellwidth).shapeHeight(options.grid.cellheight).scale(_this.scales.legendColor);
            _this.colorLegend.call(_this.legend).attr('transform','translate('+ (w-options.colorLegend.width) +','+ o +')');
            _this.scales.demoC = {};
            _this.options.demographics.forEach(function (d) {
                var range = d.values.map(function (x) { return x.color; });
                var domain = d.values.map(function (x) { return x.value; });
                _this.scales.demoC[d.field] = d3.scaleOrdinal().domain(domain).range(range);
                _this.scales.demoC[d.field].legend = d3.legendColor()
                    .orient('vertical')
                    .shapeWidth(options.grid.cellwidth)
                    .shapeHeight(options.grid.cellheight)
                    .labelOffset(4)
                    .scale(_this.scales.demoC[d.field]);
                                
            });
            _this.demoLegend.attr('transform','translate('+(gw+options.innerLayout.margins+g.cellwidth) + ','+(gh+g.cellheight+o)+')');
        }
    }

    this.randomize = function () {
        _this.scales.gridY.domain(shuffle(_this.scales.gridY.domain()));
        _this.scales.gridX.domain(shuffle(_this.scales.gridX.domain()));
        draw(1000);
        
    }
    this.sort = function (opts) {
        if (!opts) opts = { x: true, y: true };
        if (opts.y) {
            _this.data.alteration_count = _this.data.alteration_count.sort(function (a, b) {
                return b.value - a.value;
            });
            _this.scales.gridY.domain(_this.data.alteration_count.map(function (e) {
                return e.key;
            }));
        }
        if (opts.x) {
            sortByGeneOrder();
        }

        draw(1000);
    }
    function draw(duration) {
        _this.grid.selectAll('.cell')
            .transition()
            .duration(duration)
            .attr('transform',function(d){
            		var e = d3.select(this);
            		if(e.classed('dragging-y')){
            			var y = parseFloat(e.attr('gy'));
            		}
            		else{
            			var y = _this.scales.gridY(d.gene);
            			e.attr('gy',y);
            		}
            		if(e.classed('dragging-x')){
            			var x = parseFloat(e.attr('gx'));
            		}
            		else{
            			var x = _this.scales.gridX(d.sample);
            			e.attr('gx',x);
            		}
            		
            		return 'translate(' + x + ',' + y + ')';
            }).each(function(d,i) {
            		var children = d3.selectAll(this.childNodes);
            		children.attr('width',_this.scales.gridX.bandwidth());
            	});
            
        _this.demographics.selectAll('.cell')
            .transition()
            .duration(duration)
            .attr('y', function (d) {
                var e = d3.select(this);
                var y = e.classed('dragging-y')? e.attr('y') : _this.scales.demographicsY(d.fieldname);
                e.attr('gy',y);
                return y;
            })
            .attr('x', function (d) {
                var e = d3.select(this);
                var x = e.classed('dragging-x') ? e.attr('x') : _this.scales.gridX(d.sample);
                e.attr('gx',x);
                return x;
            })
            .attr('width', function (d) {
                return _this.scales.gridX.bandwidth();
            });
        _this.zoomable.select('.zoom-rect')
            .attr('x', _this.scales.gridX.range()[0])
            .attr('width', _this.scales.gridX.range()[1] - _this.scales.gridX.range()[0]);
        _this.bar.selectAll('.gene:not(.dragging-y)')
            .transition()
            .duration(duration)
            .attr('transform', function (d) {
                var e = d3.select(this);
                return 'translate(-' + _this.scales.barX(d.value) + ',' + _this.scales.gridY(d.key) + ')';
            });
        _this.geneLegend.selectAll('.gene:not(.dragging-y)')
            .transition()
            .duration(duration)
            .attr('y', function (d) {
                var e = d3.select(this);
                return _this.scales.gridY(d.key) + _this.scales.gridY.bandwidth() / 2;
            })
        _this.sampleLegend.selectAll('.sample')
            .transition()
            .duration(duration)
            .attr('x', function (d) {
                var e = d3.select(this);
                return e.classed('dragging-x') ? e.attr('x') : 0
            })
            .attr('y', 0)
            .attr('transform', function (d) {
                var e = d3.select(this);
                return e.classed('dragging-x') ? e.attr('transform') : 'translate(' + (_this.scales.gridX(d.key) + _this.scales.gridX.bandwidth() / 2) + ',0)';
            });
        _this.demoTitles.selectAll('text')
            .transition()
            .duration(duration)
            .attr('y', function (d) {
                var e = d3.select(this);
                return e.classed('dragging-y') ? e.attr('y') : _this.scales.demographicsY(d) + _this.scales.demographicsY.bandwidth() / 2;
            })
        _this.demoLegend.selectAll('.demolegend')
            .transition()
            .duration(duration)
            .attr('transform', function (d) {
                var e = d3.select(this);
                return e.classed('dragging-y') ? e.attr('transform') : 'translate(0,'+(_this.scales.demographicsY(d) )+')';
            });
    }

    function sortByGeneOrder() {
    	//geneOrder is the current order of genes, as sorted by user or algorithmically
        var geneOrder = _this.scales.gridY.domain();
        
        //_this.data.mutMatrix is a 2d matrix of alteration types- use this to look up whether alterations are present or not
        var sortedSampleOrder = _this.data.sortedSamples.sort(function (a, b) {
            for (var ii = 0; ii < geneOrder.length; ++ii) {
            		//get indices of sample within mutMatrix 1st dimension
            		var sampleIndexA = _this.data.mutMatrixSampleOrder.indexOf(a);
            		var sampleIndexB = _this.data.mutMatrixSampleOrder.indexOf(b);
            		//get index of gene within mutMatrix 2nd dimension
            		var g = geneOrder[ii];
                var geneIndex = _this.data.mutMatrixGeneOrder.indexOf(g)
             
                var alterationA = _this.data.mutMatrix[sampleIndexA][geneIndex];
                var alterationB = _this.data.mutMatrix[sampleIndexB][geneIndex];
                
                
                if (alterationA && !alterationB) return -1;
                if (alterationB && !alterationA) return 1;
            }
            return 0;
            
        });
        _this.scales.gridX.domain(sortedSampleOrder);
    }
    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }
    function gridDragStart() {
        
        _this.tooltip.hide();
        var dragTarget = d3.select(this).data()[0];
        d3.selectAll('.cell').filter(function (d) {
            if (d.gene !== undefined) {
                return d.gene == dragTarget.gene;
            }
            else if(d.fieldname !==undefined){
                return d.fieldname == dragTarget.fieldname;
            }
            return false;
        }).classed('dragging-y', true);
        d3.selectAll('.cell').filter(function (d) {
            return d.sample !== undefined && d.sample == dragTarget.sample;
        }).classed('dragging-x', true);
        d3.selectAll('.gene').filter(function (d) {
            return d.key == dragTarget.gene;
        }).classed('dragging-y',true);
        d3.selectAll('.sample').filter(function(d){
            return d.key == dragTarget.sample;
        }).classed('dragging-x',true);
        d3.selectAll('.dragging-y,.dragging-x').each(function () {
            this.parentNode.appendChild(this);
        });
        this.parentNode.appendChild(this);
    }
    function gridDrag(d){
        
        var e = d3.select(this),
            dx=d3.event.dx,
            dy=d3.event.dy;
        var tr = e.attr('transform');
        
        var x = parseFloat(e.attr('gx')) + dx,
              y = parseFloat(e.attr('gy')) + dy;
           
                    
        _this.grid.selectAll('.dragging-y').attr('transform', function (d) {
            var e = d3.select(this);
            var x = parseFloat(e.attr('gx'));
            var y = parseFloat(e.attr('gy'));
            e.attr('gy',y+dy);
            return 'translate(' + (x) + ',' +(y+dy) + ')';
        });
        _this.grid.selectAll('g.cell.dragging-x').attr('transform', function (d) {
        	   var e = d3.select(this);
            var x = parseFloat(e.attr('gx'));
            var y = parseFloat(e.attr('gy'));
            e.attr('gx',x+dx);
            return 'translate(' + (x + dx) + ',' +y + ')';
        });
        _this.demographics.selectAll('.dragging-y').attr('y', function (d) {
            var e = d3.select(this);
            var x = parseFloat(e.attr('gx'));
            var y = parseFloat(e.attr('gy'));
            e.attr('gy',y+dy);
            return y+dy;
        });
        _this.demographics.selectAll('.dragging-x').attr('x', function (d) {
            var e = d3.select(this);
            var x = parseFloat(e.attr('gx'));
            var y = parseFloat(e.attr('gy'));
            e.attr('gx',x+dx);
            return x+dx;
        });
		 _this.sampleLegend.selectAll('.sample.dragging-x')
		 	.attr('gx',x)
		 	.attr('transform','translate('+x+',0)');
        _this.bar.selectAll('.gene.dragging-y')
        	.attr('transform',function(d){
        		var e = d3.select(this);
        		var t = getTranslation(e.attr('transform'));
        		return 'translate(' + (t[0]) + ',' + (t[1]+dy) + ')';
        	});
        _this.geneLegend.selectAll('.gene.dragging-y')
        	.attr('y',y+ _this.scales.gridY.bandwidth() / 2);	
        
                    
        
        var X = _this.scales.gridX.domain().sort(function (a, b) {
            var ac = d.sample == a ? x : _this.scales.gridX(a);
            var bc = d.sample == b ? x : _this.scales.gridX(b);
            return ac - bc;
        });
        
        var Y = _this.scales.gridY.domain().sort(function (a, b) {
            var ac = d.gene == a ? y : _this.scales.gridY(a);
            var bc = d.gene == b ? y : _this.scales.gridY(b);
            return ac - bc;
        });
        var dY = _this.scales.demographicsY.domain().sort(function (a, b) {
            var ac = d.fieldname == a ? y : _this.scales.demographicsY(a);
            var bc = d.fieldname == b ? y : _this.scales.demographicsY(b);
            return ac - bc;
        });

        var oldX = _this.scales.gridX.domain();
        var oldY = _this.scales.gridY.domain();
        var oldDemoY = _this.scales.demographicsY.domain();

        var redraw = false;
        for (var ii = 0; ii < oldX.length; ++ii) {
            if (oldX[ii] !== X[ii]) {
                redraw = true; _this.scales.gridX.domain(X); break;
            }
        }
        for (var ii = 0; ii < oldY.length; ++ii) {
            if (oldY[ii] !== Y[ii]) {
                redraw = true; _this.scales.gridY.domain(Y); break;
            }
        }
        for (var ii = 0; ii < oldDemoY.length; ++ii) {
            if (oldDemoY[ii] !== dY[ii]) {
                redraw = true; _this.scales.demographicsY.domain(dY); break;
            }
        }
        if (redraw) {
            draw(0);
        }
        
        
    }
    function gridDragEnd() {
        
        d3.selectAll('.dragging-y,.dragging-x').classed('dragging-y dragging-x', false);
        draw(0);
    }
    function getTranslation(transform) {
        //see http://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4 for source
        // Create a dummy g for calculation purposes only. This will never
        // be appended to the DOM and will be discarded once this function 
        // returns.
        if (transform.substr(0,9)=='translate')
        {
        	var nums = transform.match(/translate\(([-\d\.]+),\s*([-\d\.]+)\)/);
        	return [parseFloat(nums[1]), parseFloat(nums[2])];
        }
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // Set the transform attribute to the provided string value.
        g.setAttributeNS(null, "transform", transform);

        // consolidate the SVGTransformList containing all transformations
        // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
        // its SVGMatrix. 
        var matrix = g.transform.baseVal.consolidate().matrix;

        // As per definition values e and f are the ones for the translation.
        return [matrix.e, matrix.f];
    }
    function rescaleOrdinalX(scale, t) {
        var original_range = scale.range();
        var limit = [0, _this.gridsize.width];
        var r = original_range;
        var x = t.x;
        var k = t.k;
        var z = scale.zoom;
        if (!z) z = 1;
        var tx = scale.translateX;
        if (!tx) tx = t.x;

        var f = k / z;
        var dx = t.x - tx;
        r[0] = x + dx + (original_range[0] - x) * f;
        r[1] = x + dx + (original_range[1] - x) * f;
        
        if (r[0] > limit[0]) {
            var delta = r[0]-limit[0];
            r[0] = r[0] - delta;
            r[1] = r[1] - delta;
        }
        if (limit[1] > r[1]) {
            var delta = limit[1] - r[1];
            r[1] = r[1] + delta;
            r[0] = r[0] + delta;
        }

        var s = scale.copy();
        //console.log(k, r);
        s.zoom = k;
        s.translateX = t.x;
        s.range(r);
        return s;
    }

    function setupMutationConfig() {
        var mci = $('#mutation-file-info .mutation-config-info');
        if (mci.length == 0) {
            mci = $('<div>', { class: 'mutation-config-info' }).appendTo('#mutation-file-info');
        }
        mci.text(_this.data.samples.length + ' samples');
    }
    function setupDemographicsConfig() {
        var d = $('#demographics-fields');
        d.empty();
        var ii = 0;
        var num = Object.keys(_this.demo.fields).length;
        $.each(_this.demo.fields, function (k, v) {
            ii++;
            
	    if (v.field == 'sample') return;
            var unique_values = v.values.filter(function (v, i, s) { return s.indexOf(v) === i; });
            var vals = $('<div>');
            var numvals = unique_values.length;
            unique_values.forEach(function (e, i) {
                vals.append($('<span>').text(e + ': '));
                var cp = $('<button>', { class: 'colorpicker'}).data('value',e).appendTo(vals);
                vals.append('<br>');
                var color = new jscolor(cp[0]);
                color.fromHSV(360 / num * ii, 25+75 * (1-i / numvals), 25+75*(1-i/numvals) );
            });
            var cb = $('<input>', { class:'field', type: 'checkbox' }).on('change', function () {
                if ($(this).prop('checked')) vals.show();
                else vals.hide();
            }).data({ field: k, target: vals }).appendTo(d);
            $('<span>').text(k + ' (' + unique_values.length + ' unique values)').appendTo(d);
            vals.appendTo(d).hide();
            $('<br>').appendTo(d);
            
        });
    }
    function updateOptions() {
        _this.options.demographics=[];
        $('#demographics-fields .field').each(function (i, e) {
            e = $(e);
            if (e.prop('checked')) {
                var values = [];                
                e.data('target').find('.colorpicker').each(function (ii, ee) {
                    ee = $(ee);
                    values[ii] = { value: ee.data('value'), color: '#' + ee.text() };
                });
                _this.options.demographics.push({ field: e.data('field'), values: values });
            }
                
        });
        _this.demofields = _this.options.demographics.map(function (x) { return x.field; });
    }

    var downloadableFile = null;
    function makeFile(svg) {
        var data = new Blob([svg], { type: 'text/svg' });

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (downloadableFile !== null) {
            window.URL.revokeObjectURL(downloadableFile);
        }

        downloadableFile = window.URL.createObjectURL(data);

        // returns a URL you can use as a href
        return downloadableFile;
    };

    return this;
    
    //function sorts samples based on a 2D mutation array for a predetermined order of genes and returns order of samples   
    function sortMutMatrix(genomicMatrix) {
        var geneCount = genomicMatrix[0].length;

        var sortedData = genomicMatrix.sort(function (a, b) {
            i = 0;
            while (i < geneCount - 1) {
                if (a[i] != b[i]) {
                    return d3.descending(a[i], b[i]);
                    break;
                }
                else {
                    if (i == geneCount - 2) {
                        return d3.descending(a[i], b[i]);
                        break;
                    }
                }

                i++
            }
        });

        return get_sample_order(sortedData);
    }

    //function to extract sorted sample names from the sorted sample matrix   
    function get_sample_order(sortedMatrix) {
        var samples = [];
        for (var x = 0; x < sortedMatrix.length; x++) {
            var arrLen = sortedMatrix[x].length;
            samples.push(sortedMatrix[x][arrLen - 1]);
        }
        return samples;
    }

    //function returns a 2D array for genomic alteration data
    function createSampleMutationArray(genomicData, geneList, sampleList) {
        var mutationMatrix = [];
        var geneListLen = geneList.length;

        sampleList.forEach(function (item, index) {
            var tempArr = [];

            //filter the genomic data array using sample name
            tempArr = genomicData.filter(function (value, subIndex) {
                return value.sample == item;
            });

            //define the mutType array
            var mutTypeArr = [];

            //Populate mutType array with default value of 0.
            for (var i = 0; i < geneListLen; i++) {
                mutTypeArr.push(0);
            }

            //add sample name as the last element of the mutType array.
            mutTypeArr.push(item);

            //iterate over each filtered genomic data item and update the mutType array    
            tempArr.forEach(function (gData, subindex) {
                if (gData.gene != "") {
                	var geneArrayPos = getIndexPos(gData.gene, geneList);
                    //var mutTypeInfo = mutTypeEncoding[gData.type];
                    //mutTypeArr[geneArrayPos] = mutTypeInfo.code;
			mutTypeArr[geneArrayPos] =1;
                }
            });

            //add to the mother array
            mutationMatrix.push(mutTypeArr);
        });

        return mutationMatrix;
    }

    //get index for an array position in an array by the value within the sub array
    function getIndexPos(lookUpValue, array) {
        for (var i = 0; i < array.length; i++) {
            if (array[i][0] == lookUpValue.toUpperCase()) {
                return i;
            }
        }
        return -1;
    }

    function populateNegatives(inputData, sampleList, geneList) {
        var completeData = inputData;

        sampleList.forEach(function (item, index) {
            var tempArr = [];

            //filter the genomic data array using sample name
            tempArr = inputData.filter(function (value, subIndex) {
                return value.sample == item;
            });

            //define the geneLists
            var posGeneList = [];
            var negGeneList = [];

            //iterate over each filtered genomic data item and update the mutType array    
            posGeneList = tempArr.map(function (gData, subindex) {
                if (gData.gene != "") {
                    return gData.gene;
                }
            });

            negGeneList = geneList.filter(function (d) {
                return !posGeneList.includes(d);
            });

            //iterate through the list of negative genes and add it to the completeData array for a given sample
            negGeneList.forEach(function (d, i) {
                var tempObj = {
                    "sample": item,
                    "gene": d,
                    "alterations": [],
                    "type": "wt"
                };

                completeData.push(tempObj);
            });
        });

        //remove empty objects from the completeData array
        completeData = completeData.filter(function (d, i) {
            if (d.gene != "") {
                return true;
            }
            else {
                return false;
            }
        });

        return completeData;
    }

    //function returns gene list in descending order of event frequency in a given sample set
    function orderGeneList(geneList, genomicData) {
        var geneAltFreq = {};

        //initialize the geneObjectList and set value for each gene frequency to 0
        geneList.forEach(function (item, index) {
            geneAltFreq[item] = 0;
        });

        var sampleGeneArr = [];

        //iterate through json object data and calculate frequency of alterations for each gene
        genomicData.forEach(function (item, index) {
            if (item.gene != '') {
                var count = 0;
                var sampleGeneText = item.sample + "-" + item.gene;
                if (sampleGeneArr.indexOf(sampleGeneText) == -1)
                {
                    sampleGeneArr.push(sampleGeneText);
                    count = geneAltFreq[item.gene];
                    count++;
                    geneAltFreq[item.gene] = count;
                }
            }
        });

        //sort the json object by descending order of alteration frequency
        var sortedGeneList = sortJsonObj(geneAltFreq, "desc");

        return sortedGeneList;
    }

    //function sorts fields in a json object by its values and returns an array of sorted array. sortOrder determines the direction. (values accepted asc, desc)
    function sortJsonObj(jsonObj, sortOrder) {
        var retArr = [];

        //convert the json object to array 
        var retArr = [];
        for (var item in jsonObj) {
            retArr.push([item, jsonObj[item]]);
        }

        //sort this array by alteration frequency
        retArr.sort(function (a, b) {
            switch (sortOrder) {
                case "asc":
                    return a[1] - b[1];
                    break;

                case "desc":
                    return b[1] - a[1];
                    break;
            }
        });

        return retArr;
    }

    //function returns a unique sample name list from a given dataset
    function getSampleList(genomicData) {
        var sampleList = [];
        var uniqueSampleList = [];

        //get list of all samples from the dataset
        genomicData.forEach(function (item, index) {
            sampleList.push(item.sample);
        });

        //remove duplicates
        uniqueSampleList = getUniqueElements(sampleList);

        return uniqueSampleList;
    }



    //function returns a unique gene list from a given sample set
    function getGeneList(genomicData) {
        var geneList = [];
        var uniqueGeneList = [];

        //get the list of all genes from the dataset
        genomicData.forEach(function (item, index) {
            if (item.gene != "") {
                geneList.push(item.gene);
            }
        });

        //remove duplicate items in the array
        uniqueGeneList = getUniqueElements(geneList);

        return uniqueGeneList;
    }


    //function returns unique elements in a given array
    function getUniqueElements(dataArray) {
        var returnArray = [];
        returnArray = dataArray.filter(function (value, index, arr) {
            return arr.indexOf(value) == index;
        });
        return returnArray;
    }

    //function to convert delimited data into an array of JSON object
    function textToJson(tData, delimiter) {
		//get rows from the data and generate an array of rows
    	var rows = tData.trim().split(/\r\n|[\r\n]/).map(function (e, i) {
        	return e.trim().split(delimiter);
        });

        //get column names to generate field names for object
		var colNames = rows[0].map(function(e){return e.toLowerCase(); });

		//iterate through the remainder of the rows of data and create a structure of json objects with key indices of sample and gene
		var retInfo = {};
		for (var i = 1; i < rows.length; i++) {
			var rowDataArr = rows[i];            
			var jsonObj = { };
			if (rowDataArr.length > 0) { // if row is empty exclude it				
				for (j = 0; j < colNames.length; j++) {
					if (rowDataArr[j] == undefined) { // if a field in a row is empty then put in a blank entry
						jsonObj[colNames[j].toString().trim()] = '';
					}
					else {
                        if (j == colNames.length - 1) { //for the last column "type" convert the contents to lower case
                            //check for valid mutation type names
                            var inputMutType = rowDataArr[j].toString().toLowerCase().trim();

                            if (mutTypeEncoding[inputMutType] == undefined && inputMutType.trim() != '') {
                                alert('Incorrect mutation type detected. ' + inputMutType);
                                return false;
                            }
                            jsonObj[colNames[j].toString().trim()] = rowDataArr[j].toString().toLowerCase();
                        }
                        else {
                            jsonObj[colNames[j].toString().trim()] = rowDataArr[j].toString();
                        }
                        //var label = colNames[j][0].toUpperCase() + colNames[j].substring(1);
                        
                        //jsonObj.celldata[label]=rowDataArr[j].toString();
                    }
                }
			}
			// find the sample; create an empty object if this is the first instance of this sample.
			var sample = retInfo[jsonObj.sample];
			if(!sample) retInfo[jsonObj.sample] = {};
			//find the sample/gene combo for this cell; if this is the first instance, initialize the value to an empty array
			if(jsonObj.gene != ''){
		    	var cell = retInfo[jsonObj.sample][jsonObj.gene];
                if(!cell) cell = [];
		    	//push a json object with alteration and type onto the array
		    	cell.push({alteration: jsonObj.alteration, type: jsonObj.type});
		    	retInfo[jsonObj.sample][jsonObj.gene] = cell;
			}
        }

		var retArray = [];
		var samples = Object.keys(retInfo);
		for(var i=0; i<samples.length;++i){
			var genes = Object.keys(retInfo[samples[i]]);
			if(genes.length==0){
				var cell = {sample:samples[i], gene: ''};
				retArray.push(cell);
			}
			else{
				for(var j=0;j<genes.length;++j){
					var celldata = {Sample: samples[i], Gene: genes[j]};
					var alterations = retInfo[samples[i]][genes[j]];
					if(alterations.length == 1){
						celldata['Alteration'] = alterations[0].alteration + ' - ' + alterations[0].type;
					}
					else if(alterations.length > 1){
						for(var a = 0; a<alterations.length; ++a){
							celldata['Alteration '+(a+1)] = alterations[a].alteration + ' - ' + alterations[a].type;
						}
					}
					var cell = {sample:samples[i], gene: genes[j], alterations: alterations, celldata: celldata };
					retArray.push(cell);
				}
			}
		}
        return retArray;
    }


}

