function Comut() {
    var _this = this;
    
    _this.data = {
    	genomic: { samples:[], genes:[], cells: [] },
    	demographics:  { headers:[], fields:[], cells: [] },
    	samples:{},
    };
    
    _this.default_options = {
        target: '',
        editableOptions:true,
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
		mutTypeEncoding: {
		    "wt": { "color": "#D4D4D4", "text": "No alteration","legendOrder":8 },
		    "missense": { "color": "#0F8500", "text": "Missense","legendOrder":0 },
		    "stop": {"color": "#000000", "text": "Stop gain","legendOrder":1 },
		    "fs": { "color": "#5E2700", "text": "Frameshift","legendOrder":2 },
		    "inframe": { "color": "#C973FF", "text": "Inframe","legendOrder":3 },
		    "splice": { "color": "#F57564", "text": "Splice site","legendOrder":4 },
		    "amp": { "color": "#2129FF", "text": "Amplification","legendOrder":5 },
		    "del": { "color": "#FF0000", "text": "Deletion/loss","legendOrder":6 },
		    "fusion": { "color": "#00BFFF", "text": "Fusion","legendOrder":7 }
		},
        dataInput: {
            filePicker: true,//if true, adds a button to select a file
            pasteBox:false,//if true, adds a textinput for copy/paste
        }
    };
    _this.mode = {
        interaction: 'none'
    };

    var newDragSelection = null;
    
    this.init = function (options) {
        //now that the widget has been initialized, add the API function to pass in data
        _this.setData=setData;
    	
    	//extend the default options with the passed-in options, overriding defaults when needed
        _this.options = $.extend(true, {}, _this.default_options, options);
        options = _this.options;
        
        //where should the widget be located within the page?
        if (options.target && $(options.target).length >0 ) {
            _this.widget = $(options.target).eq(0);
        }
        else {
            _this.widget = $('<div>', { class: 'comut' }).hide().appendTo('body');
        }
		 
		//create the widget controls for selecting interactive modes        
        setupModeControls();
        
        //add div to act as the container for the comut plot widget itself        
		  _this.svgcontainer = $('<div>',{class:'comut-svg-container'}).appendTo(_this.widget);
		  //select the container as a d3 selection instead of jquery for convenience
		  _this.d3widget = d3.select(_this.svgcontainer[0]);
		  
		  //create the configuration panel
        setupConfigPanel();
        
        //create elements to allow saving svg via download mechanism
        setupSVGDownload();
        
        //set up the tooltip to work to display extra information        
        setupTooltip();
        
        //create the components of the comut plot (sample grid, demographic grid, legends, titles, graphs, etc)
        setupWidgetComponents();
        
	} // end of this.init
	
	function setupWidgetComponents(){
		var options = _this.options;
        var w = options.bar.width + options.geneLegend.width + options.grid.cellwidth + options.innerLayout.margins * 3 + options.colorLegend.width;
        var h = options.grid.cellheight + options.sampleLegend.height+options.innerLayout.margins;
        var o = options.sampleLegend.height + options.innerLayout.margins;
        var g = options.grid;

        

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

        $('#radio-none').click(); //do this after zoom and drag object are created
        
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

		 _this.bargraph = _this.svg
            .append('g')
            .attr('transform', 'translate(' + options.bar.width + ',' + o + ')');
        _this.bar = _this.bargraph.append('g')
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
        if(!_this.scales) _this.scales={};
	}
	
//------------------------------setupConfigPanel --------------------------------//	
	function setupConfigPanel(){
		var options = _this.options;
        var ctrls = $('.comut-ctrls');
        $(document).on('click','.panel-header',function(event){
        	var target = $(this).data('target');
        	var show = target.is(':hidden');
        	$(this).data('target').toggleClass('collapsed');
        	$(this).attr('collapsed',show==false);
        })
        var optionspanel = $('<div>',{class:'comut-options-panel'}).prependTo(ctrls);
        var optionsheader = $('<div>',{class:'optionsheader'}).appendTo(optionspanel);
		  
		  //Data selection and saving - "File" menu functions
        var filepanel = $('<div>',{class:'comut-panel collapsed'}).insertAfter(optionsheader);
        var filepanelHeader = $('<div>',{class:'panel-header',collapsed:true}).text('File').prependTo(optionsheader).data('target',filepanel);
        
        var loadpanel =   $('<div>',{class:'load-data'}).appendTo(filepanel);
        var fileInfo = $('<div>', { id:'file-info', class: 'config-group' }).appendTo(loadpanel);
         
		  if (options.dataInput.filePicker == true) {
            _this.filePicker = $('<input>', { type: 'file', class: 'comut-file-picker', id: 'mfile' }).insertBefore(fileInfo).on('change', function (e) {
                loadFile(e);
            });
            $('<label>', { for: 'mfile' }).text('Select data file(s) to load').insertBefore(_this.filePicker);
        }
        if(options.dataInput.pasteBox == true){
            _this.pasteBoxM = $('<input>', { type: 'text', class: 'comut-paste-box', placeholder: 'Paste data here' }).insertBefore(fileInfo)
                .on('paste', function (e) {
                    clipboardData = e.originalEvent.clipboardData || window.originalEvent.clipboardData;
                    pastedData = clipboardData.getData('text');
                    processTextData(pastedData,'Pasted from clipboard');
                     
                    $(this).val('');
                    return false;
                });
        }
		//display info about the selected file(s)
       var genomicsInfo = $('<div>', { id:'mutation-file-info'}).appendTo(fileInfo);
		 var demographicInfo = $('<div>',{id:'demographic-file-info'}).appendTo(fileInfo);            
        //add button to create the widget with this data
        $('<button>', { class: 'add-data-button' }).text('Add this data to the Comut plot').on('click', function () {
        		$(this).hide();
            //filepanelHeader.click();
            updateOptions();
            configureWidget();
            createDataSVG();
        }).appendTo(fileInfo).hide();
         
         
        //"save" panel   
        var savepanel =   $('<div>',{class:'config-panel save-data'}).appendTo(filepanel);    
		  $('<button>').text('Save data and configuration').appendTo(savepanel).on('click',saveDataAndConfig);
        $('<button>').text('Save data only').appendTo(savepanel).on('click',saveData); 
        $('<button>').text('Save configuration only').appendTo(savepanel).on('click',saveConfig);
        
        
		  
		  var configpanel =   $('<div>',{class:'comut-panel collapsed'}).appendTo(optionspanel);

			//only provide the control to open show this dialog if the initial options allow it		  
		  if(_this.options.editableOptions) $('<div>',{class:'panel-header',collapsed:true}).text('Edit').appendTo(optionsheader).data('target',configpanel);
         
        //Other configuration options - layout, colors, gene/demographic filters
        _this.optionsEditor = {}; //structure to hold input elements
        
        //layout
        var layoutConfig = $('<div>',{class:'comut-panel collapsed'});
        $('<div>').appendTo(configpanel).append(layoutConfig);
        $('<h4>',{class:'panel-header',collapsed:true}).text('Edit widget layout').data('target',layoutConfig).insertBefore(layoutConfig);
        
        $('<label>').text('Cell width: ').appendTo(layoutConfig);
        _this.optionsEditor.gridCellWidth = $('<input>',{type:'number'}).appendTo(layoutConfig).val(_this.options.grid.cellwidth);
        $('<label>').text('height: ').appendTo(layoutConfig);
        _this.optionsEditor.gridCellHeight = $('<input>',{type:'number'}).appendTo(layoutConfig).val(_this.options.grid.cellheight);
        $('<label>').text('padding between cells: ').appendTo(layoutConfig);
        _this.optionsEditor.gridPadding = $('<input>',{type:'number'}).appendTo(layoutConfig).val(_this.options.grid.padding);
        $('<br>').appendTo(layoutConfig);
        $('<label>').text('Max grid width: ').appendTo(layoutConfig);
        _this.optionsEditor.gridMaxWidth = $('<input>',{type:'number'}).appendTo(layoutConfig).val(_this.options.grid.maxgridwidth);
        $('<br>').appendTo(layoutConfig);
        $('<label>').text('Spacing between areas: ').appendTo(layoutConfig);
        _this.optionsEditor.innerMargins  = $('<input>',{type:'number'}).appendTo(layoutConfig).val(_this.options.innerLayout.margins);
        $('<label>').text('Bar plot width ').appendTo(layoutConfig);
        _this.optionsEditor.barPlotWidth = $('<input>',{type:'number'}).appendTo(layoutConfig).val(_this.options.bar.width);
        $('<br>').appendTo(layoutConfig);
        $('<label>').text('Gene label width ').appendTo(layoutConfig);
        _this.optionsEditor.geneLegendWidth = $('<input>',{type:'number'}).appendTo(layoutConfig).val(_this.options.geneLegend.width);
        $('<br>').appendTo(layoutConfig);
        $('<label>').text('Sample label width ').appendTo(layoutConfig);
        _this.optionsEditor.sampleLegendHeight = $('<input>',{type:'number'}).appendTo(layoutConfig).val(_this.options.sampleLegend.height);
        $('<label>').text('Show sample labels? ').appendTo(layoutConfig);
        _this.optionsEditor.sampleLegendShow = $('<input>',{type:'checkbox'}).appendTo(layoutConfig).attr('checked',_this.options.sampleLegend.show);
        $('<br>').appendTo(layoutConfig);
        $('<label>').text('Color legend width ').appendTo(layoutConfig);
        _this.optionsEditor.colorLegendWidth = $('<input>',{type:'number'}).appendTo(layoutConfig).val(_this.options.colorLegend.width);
        $('<br>').appendTo(layoutConfig);
        
        //alteration setup
        var alterationSetup = $('<div>', { id: 'alteration-setup',class:'comut-panel collapsed' });
        $('<div>').appendTo(configpanel).append(alterationSetup);
        $('<h4>',{class:'panel-header',collapsed:true}).text('Alteration encoding').data('target',alterationSetup).insertBefore(alterationSetup);
        /*$.each(_this.options.mutTypeEncoding,function(k,v){
        	addAlterationConfig(k,v,alterationSetup);
        });*/
        setupAlterationConfig();
        
        //gene filter - add configuration area now, will be further set up when data is added
        var geneSelection = $('<div>', { id: 'gene-fields',class:'comut-panel collapsed' });
        $('<div>').appendTo(configpanel).append(geneSelection);
        $('<h4>',{class:'panel-header',collapsed:true}).text('Select genes to display').data('target',geneSelection).insertBefore(geneSelection);
        
        
        //demographic filter - add configuration area now, will be further set up with data is added
        var demographicConfig = $('<div>', { id: 'demographics-fields',class:'comut-panel collapsed' });
        $('<div>').appendTo(configpanel).append(demographicConfig);
        $('<h4>',{class:'panel-header',collapsed:true}).text('Select demographic info to display').data('target',demographicConfig).insertBefore(demographicConfig);
     
	  	  
		  
        
        
        //add button to update the widget with the new options
        $('<button>', { class: 'btn btn-default' }).text('Update Comut plot settings').on('click', function () {
            updateOptions();
            configureWidget();
            createDataSVG();
        }).appendTo(configpanel);
        
	} //end of function setupConfigPanel(){...}
	
	//--------------- createDataSVG -----------------------------------------------------------//
        function createDataSVG() {
            _this.grid.selectAll('.cell').data([]).exit().remove();
            _this.demographics.selectAll('.cell').data([]).exit().remove();
            _this.geneLegend.selectAll('.gene').data([]).exit().remove();
            _this.bar.selectAll('.gene').data([]).exit().remove();
            _this.demoTitles.selectAll('.fieldname').data([]).exit().remove();
            _this.demoLegend.selectAll('.demolegend').data([]).exit().remove();
            _this.sampleLegend.selectAll('.sample').data([]).exit().remove();

            var data = _this.data.genomic;
            var genomic_samples=data.samples;
            
            _this.grid
                .selectAll('.cell')
                .data(data.cells)
                .enter()
                .filter(function (d) {
                    return _this.options.genesToPlot.includes(d.gene) && genomic_samples.includes(d.sample);
                })
                .append('g')
                .attr('class', 'cell  draggable-x draggable-y')
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
								return _this.options.mutTypeEncoding[a.type] - _this.options.mutTypeEncoding[b.type];
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
                .data(_this.data.demographics.cells)      
                .enter()
                .filter(function (d) {
                    return _this.options.demofields.indexOf(d.fieldname) != -1 && genomic_samples.indexOf(d.sample)!=-1;
                })
                .append('svg:rect')
                .attr('class', 'cell  draggable-x draggable-y')
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
                    return _this.scales.demoC[d.fieldname](d.value);
                })
                .on('mouseover', _this.tooltip.show)
                .on('mouseout', _this.tooltip.hide)
                .call(_this.drag);

            
            var bar_enter = _this.bar.selectAll('.gene')
                .data(data.alteration_count)
                .enter()
                .filter(function (d) {
                    return _this.options.genesToPlot.includes(d.key);
                })
                .append('g')
                .attr('class', 'gene draggable-y')
                .attr('transform', function (d) {
                    return 'translate(-'+_this.scales.barX(d.value)+','+_this.scales.gridY(d.key)+')';
                })
                .call(_this.drag);
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
                .text(function (d) { return (d.value / _this.data.genomic.samples.length * 100).toFixed(0) + '%'; });

            _this.geneLegend.selectAll('.gene')
                .data(data.genes)
                .enter()
                .filter(function (d) {
                    return _this.options.genesToPlot.includes(d.key);
                })
                .append('svg:text')
                .attr('class', 'gene draggable-y')
                .attr('y', function (d) {
                    return _this.scales.gridY(d.key) + _this.scales.gridY.bandwidth() / 2;
                })
                .text(function (d) { return d.key; })
                .attr('dominant-baseline', 'middle')
                .style('cursor','pointer')
                .on('click',function(d){
                	sortByRow('gene',d.key);
                })
                .call(_this.drag);

            _this.demoTitles.selectAll('.fieldname')
                .data(_this.data.demographics.fields)
                .enter()
                .filter(function (d) {
                    return _this.options.demofields.indexOf(d.field) != -1;
                })
                .append('svg:text')
                .attr('class', 'fieldname draggable-y')
                .attr('y', function (d) {
                    return _this.scales.demographicsY(d.field) + _this.scales.demographicsY.bandwidth() / 2;
                })
                .text(function (d) { return d.fieldNameOrig; })
                .attr('dominant-baseline', 'center')
                .attr('text-anchor', 'right')
                .style('cursor','pointer')
                .on('click',function(d){
                	sortByRow('demographic',d.field);
                })
                .call(_this.drag);
            var trs = getTranslation(_this.demoTitles.attr('transform'));
            trs[0] = trs[0] - _this.demoTitles.node().getBBox().width;
            _this.demoTitles.attr('transform', 'translate(' + trs[0] + ',' + trs[1] + ')');
            
            _this.demoLegend.selectAll('.demolegend')
                .data(_this.data.demographics.fields)
                .enter()
                .filter(function (d) {
                    return _this.options.demofields.indexOf(d.field) != -1;
                })
                .append('g')
                .attr('class', 'demolegend')
                .attr('transform', function (d) {
                    return 'translate(0,' + (_this.scales.demographicsY(d.field)) + ')';
                })
                .each(function (d, i, g) {
                     
                    var offset = g[i].getBoundingClientRect().left;
                    d3.select(g[i]).call(_this.scales.demoC[d.field].legend);
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
                .attr('class', 'sample draggable-x')
                .attr('transform', function (d) {
                    return 'translate(' +(_this.scales.gridX(d) + _this.scales.gridX.bandwidth() / 2)+',0)';
                })
                .call(_this.drag)
                .append('svg:text')
                .text(function (d) { return d; })
                .attr('alignment-baseline', 'middle')
                .attr('transform', 'rotate(-90)');
                
            
            _this.zoom.scaleTo(_this.grid, _this.zoom.scaleExtent()[0]);
            //_this.sort();
        }

        function zoomed() {
            
            var t = d3.event.transform;
            _this.scales.gridX = rescaleOrdinalX(_this.scales.gridX, t);
            draw(0);
             
        }

        function loadFile(e) {
            var f = e.target.files[0];
            if (!f) return;
            var reader = new FileReader();
            reader.onload = function () {
					processTextData(reader.result,'File '+f.name);                
            };
            reader.readAsText(f);
        }
        
        function processTextData(d,filename){
        	//try parsing json first
        	try{
        		var json = JSON.parse(d);
        		if(json.config) _this.options = json.config; //load config first before dealing with data
        		if(json.scales) _this.scales = json.scales;
        		if(json.data) {
        			_this.data = json.data;
        			associateDemographicsWithSamples();	
	             setupMutationFileDescription();
	             setupDemographicFileDescription();
   		          
					setupDemographicsConfig();   		          
        		}
        		if(json.config){
        			setupMutationConfig();
        			setupAlterationConfig();
        		}
        		
        	}
        	catch (e){
        		var rows = d.trim().split(/\r\n|[\r\n]/);
        		var header = rows[0].split('\t').map(function(e){return e.toLowerCase();});
        		if(header.indexOf('sample')>-1&&header.indexOf('gene')>-1&&header.indexOf('alteration')>-1&&header.indexOf('type')>-1){
        			processMutationData(d,filename);
        			associateDemographicsWithSamples();	
            		setupMutationFileDescription();
            		setupMutationConfig();
            		setupAlterationConfig();
        		}
        		else if(header.indexOf('sample')>-1){
        			processDemographicData(d,filename);
        			associateDemographicsWithSamples();
            		setupDemographicFileDescription();
            		setupDemographicsConfig();
        		}
        	}
        	//find first line and see if it is a genomic file or demographic file
        }
        function processMutationData(d,datasource) {
        	
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
		    var sampleMatrix = sortMutMatrix(mutMatrix);
		    
		    
            _this.data.genomic = {};
            _this.data.genomic.source = datasource;
            _this.data.genomic.sortedGenes = sortedGeneAltFreq;
            _this.data.genomic.genes = sortedGeneAltFreq.map(function(e){ return {key:e[0], }; });
            _this.data.genomic.cells = completeGenomicData;
            _this.data.genomic.samples = sampleMatrix;
            _this.data.genomic.mutMatrix = mutMatrix;
            _this.data.genomic.mutMatrixSampleOrder = mutMatrix.map(function(e){return e[e.length-1]; });
            _this.data.genomic.mutMatrixGeneOrder = sortedGeneAltFreq.map(function(e){ return e[0] });
            _this.data.genomic.alterationTypes = getAlterationTypes(completeGenomicData);
            
            _this.data.genomic.alteration_count = sortedGeneAltFreq.map(function (e) {
                return { key: e[0], value: e[1] };
            });
            
        }
        function processDemographicData(d,datasource) {
            var textarr = d.trim().split(/\r\n|\r|\n/).map(function (e, i) {
                return e.trim().split(/\t/);
            });
            var headers = textarr[0];
            textarr = textarr.slice(1);
            
            var fieldMap = {};
            headers.forEach(function (e, i) {
            		fieldMap[e.toLowerCase()] = { field: e.toLowerCase(), index: i, values:[], fieldNameOrig: e }; 
            });
            var arr = textarr.map(function (e, i) {
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
                    cells.push({ fieldname: v.field, sample: e.sample, value: e[v.field], celldata: e.celldata });
                });
                $.each(e.celldata, function (k, v) {
                    fieldMap[k].values.push(v);
                });
                
            });
            
            
            _this.data.demographics = {};
            _this.data.demographics.datasource = datasource;
            _this.data.demographics.samples = d3.nest().key(function (d) { return d.sample; }).entries(arr);
            _this.data.demographics.headers = headers;
            _this.data.demographics.fields = $.map(fieldMap,function(v,k){
            		 if(v.field != 'sample') return v;
            });
            _this.data.demographics.cells = cells;
            
        }
        function associateDemographicsWithSamples(){
        	if(!_this.data.genomic){
        		_this.data.samples={};
        		return;
        	}
        	else if(_this.data.demographics){
        		_this.data.samples={}
        		
        		$.each(_this.data.genomic.samples,function(sidx,sampleName){
        			var cells = _this.data.genomic.cells.filter(function(x){return x.sample==sampleName;});
        			var demographics = _this.data.demographics.cells.filter(function(x){return x.sample ==sampleName;});
        			var sampleGeneData = {};
        			var sampleDemographicData = {};
        			$.each(cells,function(idx,gene){
        				sampleGeneData[gene.gene.toLowerCase()]=gene;
        			});
        			$.each(demographics,function(idx,demo){
        				sampleDemographicData[demo.fieldname.toLowerCase()]=demo;
        			});
        			_this.data.samples[sampleName.toLowerCase()] = {
        				sample: sampleName,
        				gene:sampleGeneData,
        				demographic:sampleDemographicData,
        			}
        		});
        	}
        	
        
        
        }
        function configureWidget() {
        	  var demographicsToUse = _this.options.demofields;
        	  var genesToPlot = _this.options.genesToPlot;
        	  var options = _this.options;
        	  
				//First figure out which types of alterations are included in order to set the geometry appropriately        	  
        	  //convert the mutTypeEncoding keys and colors into matched arrays to create the color scale
			   var mutTypes = Object.keys(options.mutTypeEncoding);
				var colors = mutTypes.map(function (k) {
				    return options.mutTypeEncoding[k].color;
				});
				_this.scales.gridC = d3.scaleOrdinal().domain(mutTypes).range(colors);
        	  var mutTypeArray = mutTypes.map(function(val){
					var obj = options.mutTypeEncoding[val];
					obj.type = val;
					return obj;
				}).sort(function(a,b){
					var sortorder = a.legendOrder - b.legendOrder;
					if(sortorder) return (sortorder);
					return a.type.localeCompare(b.type); 
				});
				//convert the mutTypeEncoding colors and text to arrays in the order defined by options.legendOrder
				 
				 var legendEntries = mutTypeArray.reduce(function(output,curr){
				 	var include = _this.data.genomic.alterationTypes.includes(curr.type);
				 	if(include) {
				 		output.colors.push(curr.color);
				 		output.text.push(curr.text);
				 	}
				 	return output;
				 },{colors:[],text:[]});
				var legendColors = legendEntries.colors;
				var legendText = legendEntries.text;

         
            
            var g = options.grid,
                dh = (g.cellheight + g.padding) * demographicsToUse.length,
                gw = (g.cellwidth + g.padding) * _this.data.genomic.samples.length,
                gh = (g.cellheight + g.padding) * Math.max(genesToPlot.length, legendColors.length),
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
            _this.scales.gridX = d3.scaleBand().domain(_this.data.genomic.samples).range([0, gw])
                                               .paddingInner(_this.options.grid.padding / _this.options.grid.cellwidth);
            _this.scales.gridY = d3.scaleBand().domain(genesToPlot).range([0, gh])
                                               .paddingInner(_this.options.grid.padding / _this.options.grid.cellheight);
            _this.scales.demographicsY = d3.scaleBand().domain(demographicsToUse).range([0, dh])
                                               .paddingInner(_this.options.grid.padding / _this.options.grid.cellheight);
            _this.demographics.attr('transform', 'translate(0,' + (gh + g.cellheight + o) + ')');
            _this.demoTitles.attr('transform', 'translate(' +(options.bar.width + options.geneLegend.width-5) +',' + (gh + g.cellheight + o) + ')');
            
            _this.gridholder.attr('transform', 'translate(' + (options.bar.width + options.geneLegend.width + options.innerLayout.margins * 2) + ',0)');
	        	
	        _this.grid.attr('transform', 'translate(0,' + o + ')');
	
	        _this.bargraph.attr('transform', 'translate(' + options.bar.width + ',' + o + ')');
	
	        _this.geneLegend.attr('transform', 'translate(' + (options.bar.width + options.innerLayout.margins) + ',' + (o) + ')');
	        
	        _this.sampleLegend.attr('transform', 'translate(0,' + (o-options.innerLayout.margins) + ')' +
	            ' scale(1,' + (options.sampleLegend.show ? 1:0) + ')');
	            
	    //if order information is present in the data, set the domain of the scales here.
        if(_this.data.geneorder) {
            //_this.scales.gridY.domain(_this.data.geneorder);
            //Keep the existing order, with new ones at the end
            var new_ordered_list=[];
            var current_order=_this.data.geneorder;
            var new_unordered_list=_this.scales.gridY.domain();
            $.each(current_order,function(i,e){
                if(new_unordered_list.indexOf(e)>-1) new_ordered_list.push(e);
            });
            $.each(new_unordered_list,function(i,e){
                if(new_ordered_list.indexOf(e)==-1) new_ordered_list.push(e);
            });
            _this.scales.gridY.domain(new_ordered_list);
            _this.data.geneorder = new_ordered_list;
        }
	    if(_this.data.demoorder){
            //Keep the existing order, with new ones at the end
            var new_ordered_list=[];
            var current_order=_this.data.demoorder;
            var new_unordered_list=_this.scales.demographicsY.domain();
            $.each(current_order,function(i,e){
                if(new_unordered_list.indexOf(e)>-1) new_ordered_list.push(e);
            });
            $.each(new_unordered_list,function(i,e){
                if(new_ordered_list.indexOf(e)==-1) new_ordered_list.push(e);
            });
            _this.scales.demographicsY.domain(new_ordered_list);
            _this.data.demoorder = new_ordered_list;
        }
	    if(_this.data.sampleorder){
            _this.scales.gridX.domain(_this.data.sampleorder);
        }
            
	    
		
		
            
	      _this.scales.legendColor = d3.scaleOrdinal().domain(legendText).range(legendColors);
	      _this.scales.barX = d3.scaleLinear().domain([0, Math.max.apply(null, _this.data.genomic.alteration_count.map(function (x) { return x.value; })) * 1.25]).range([0, options.bar.width]);
	      _this.legend = d3.legendColor().orient('vertical').shapeWidth(options.grid.cellwidth).shapeHeight(options.grid.cellheight).scale(_this.scales.legendColor);
	      _this.colorLegend.call(_this.legend).attr('transform','translate('+ (w-options.colorLegend.width) +','+ o +')');
	      _this.scales.demoC = {};
            _this.data.demographics.fields.forEach(function (d) {
                var range = d.options.values.map(function (x) { return x.color; });
                var domain = d.options.values.map(function (x) { return x.value; });
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
    

    this.randomize = function () {
        _this.scales.gridY.domain(shuffle(_this.scales.gridY.domain()));
        _this.scales.gridX.domain(shuffle(_this.scales.gridX.domain()));
        _this.data.sampleorder = _this.scales.gridX.domain();
        _this.data.geneorder = _this.scales.gridY.domain();
        _this.data.demoorder = _this.scales.demographicsY.domain();
        draw(1000);
        
    }
    this.sort = function (opts) {
        if (!opts) opts = { x: true, y: true };
        if (opts.y) {
            _this.data.genomic.alteration_count = _this.data.genomic.alteration_count.sort(function (a, b) {
                return b.value - a.value;
            });
            _this.scales.gridY.domain(_this.data.genomic.alteration_count.map(function (e) {
                return e.key;
            }));
        }
        if (opts.x) {
            sortByGeneOrder();
        }
		  
        _this.data.geneorder = _this.scales.gridY.domain();
        _this.data.demoorder = _this.scales.demographicsY.domain();
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
                var y=e.classed('dragging-y')? 0 : _this.scales.gridY(d.key);
                e.attr('gy',y);
                return 'translate(-' + _this.scales.barX(d.value) + ',' + y + ')';
            });
        _this.geneLegend.selectAll('.gene:not(.dragging-y)')
            .transition()
            .duration(duration)
            .attr('y', function (d) {
                var e = d3.select(this);
                var y = _this.scales.gridY(d.key) + _this.scales.gridY.bandwidth() / 2;
                e.attr('gy',y);
                return y;
            })
        _this.sampleLegend.selectAll('.sample')
            .transition()
            .duration(duration)
            // .attr('x', 0)
            // .attr('y', 0)
            .attr('transform', function (d) {
                var e = d3.select(this);
                var x = e.classed('dragging-x') ? 0 : (_this.scales.gridX(d) + _this.scales.gridX.bandwidth() / 2);
                if(e.classed('dragging-x')==false) e.attr('gx',x);
                return e.classed('dragging-x') ? e.attr('transform') : 'translate(' + x + ',0)';
            });
        _this.demoTitles.selectAll('text')
            .transition()
            .duration(duration)
            .attr('y', function (d) {
                var e = d3.select(this);
                var y = e.classed('dragging-y') ? e.attr('y') : _this.scales.demographicsY(d.field) + _this.scales.demographicsY.bandwidth() / 2;
                e.attr('gy',y);
                return y;
            })
        _this.demoLegend.selectAll('.demolegend')
            .transition()
            .duration(duration)
            .attr('transform', function (d) {
                var e = d3.select(this);
                return e.classed('dragging-y') ? e.attr('transform') : 'translate(0,'+(_this.scales.demographicsY(d.field) )+')';
            });
    }

	function sortByRow(type,rowname,reverse){
		rowname = rowname.toLowerCase(); //lookup tables have lowercase keys
		var multiplier = reverse? -1 : 1;
		var currentOrder = _this.scales.gridX.domain();
		var sortableList = currentOrder.map(function(e, i){return {index:i,value:e}; });
		var sortedList = sortableList.sort(function (a, b) {
            var sampA = _this.data.samples[a.value.toLowerCase()];
            var sampB = _this.data.samples[b.value.toLowerCase()];
            var valueA = sampA[type][rowname];
            var valueB = sampB[type][rowname];
            if(type=='gene'){
            		if(valueA.alterations.length>0 && valueB.alterations.length==0) return -1*multiplier;
            		else if(valueA.alterations.length==0 && valueB.alterations.length>0) return 1*multiplier;
            		else return a.index-b.index;
            }
            else if(type=='demographic'){
            		var comparison = valueA.value.localeCompare(valueB.value);
            		if(comparison != 0){
            			return comparison * multiplier;
            		}
            		else return a.index-b.index;
            }   
       });
       //if the row is already sorted and this is the first attempt, sort in the opposite order.
       sortedSampleOrder = sortedList.map(function(e){ return e.value; });
       if(currentOrder.equals(sortedSampleOrder) && !reverse){
       	sortByRow(type,rowname,true);
       	return;
       }
       _this.scales.gridX.domain(sortedSampleOrder);
       
        _this.data.sampleorder = _this.scales.gridX.domain();
       draw(1000);
	}
    function sortByGeneOrder() {
    	//geneOrder is the current order of genes, as sorted by user or algorithmically
        var geneOrder = _this.scales.gridY.domain();
        
        //_this.data.genomic.mutMatrix is a 2d matrix of alteration types- use this to look up whether alterations are present or not
        var sortedSampleOrder = _this.data.genomic.samples.sort(function (a, b) {
            for (var ii = 0; ii < geneOrder.length; ++ii) {
            		//get indices of sample within mutMatrix 1st dimension
            		var sampleIndexA = _this.data.genomic.mutMatrixSampleOrder.indexOf(a);
            		var sampleIndexB = _this.data.genomic.mutMatrixSampleOrder.indexOf(b);
            		//get index of gene within mutMatrix 2nd dimension
            		var g = geneOrder[ii];
                var geneIndex = _this.data.genomic.mutMatrixGeneOrder.indexOf(g)
             
                var alterationA = _this.data.genomic.mutMatrix[sampleIndexA][geneIndex];
                var alterationB = _this.data.genomic.mutMatrix[sampleIndexB][geneIndex];
                
                
                if (alterationA && !alterationB) return -1;
                if (alterationB && !alterationA) return 1;
            }
            return 0;
            
        });
        _this.scales.gridX.domain(sortedSampleOrder);
        _this.data.sampleorder = _this.scales.gridX.domain();
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
        
        var sample=dragTarget.sample;
        if(sample===undefined) sample=dragTarget;
        var key=dragTarget.key;
        if(key===undefined) key=dragTarget.gene;
        if(key===undefined) key=dragTarget.fieldname;
        if(key===undefined) key=dragTarget.field;

        d3.selectAll('.cell').filter(function (d) {
            if (d.gene !== undefined) {
                return d.gene == key;
            }
            else if(d.fieldname !==undefined){
                return d.fieldname == key;
            }
            return false;
        }).classed('dragging-y', true);
        d3.selectAll('.cell').filter(function (d) {
            return d.sample !== undefined && d.sample == sample;
        }).classed('dragging-x', true);
        d3.selectAll('.gene').filter(function (d) {
            return d.key == key;
        }).classed('dragging-y',true);
        d3.selectAll('.fieldname').filter(function (d) {
            return d.field == key;
        }).classed('dragging-y',true);
        d3.selectAll('.sample').filter(function(d){
            return d == sample;
        }).classed('dragging-x',true);
        // d3.selectAll('.dragging-y,.dragging-x').each(function () {
        //     this.parentNode.appendChild(this);
        // });
        // this.parentNode.appendChild(this);
        newDragSelection = {first:d3.selectAll('.dragging-y,.dragging-x'),last:this};
        return false;
    }
    function gridDrag(d){
        if(newDragSelection) {
            newDragSelection.first.each(function () {
                this.parentNode.appendChild(this);
            });
            newDragSelection.last.parentNode.appendChild(newDragSelection.last);
            newDragSelection=null;
        }
        var e = d3.select(this),
            dx=e.classed('draggable-x')? d3.event.dx : 0,
            dy=e.classed('draggable-y')? d3.event.dy : 0;

        var tr = e.attr('transform');

        var sample=d.sample;
        if(sample===undefined) sample=d;
        var key=d.key;
        if(key===undefined) key=d.gene;
        if(key===undefined) key=d.fieldname;
        if(key===undefined) key=d.field;
        
        var gx = parseFloat(e.attr('gx'));
        var gy = parseFloat(e.attr('gy'));
        var x = dx + (isNaN(gx)?0:gx);
        var y = dy + (isNaN(gy)?0:gy);
                    
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
            .attr('transform',function(d){
                var e = d3.select(this);
                //var t = getTranslation(e.attr('transform'));
                var x = parseFloat(e.attr('gx'))+dx;
                e.attr('gx',x);
                //console.log('samp',t[0]+dx)
                return 'translate(' + (x)+ ',0)';
            });
		 	//.attr('gx',x)
		 	//.attr('transform','translate('+x+',0)');
        _this.bar.selectAll('.gene.dragging-y')
        	.attr('transform',function(d){
        		var e = d3.select(this);
        		var t = getTranslation(e.attr('transform'));
                e.attr('gy',t[1]+dy);
        		return 'translate(' + (t[0]) + ',' + (t[1]+dy) + ')';
        	});
        _this.geneLegend.selectAll('.gene.dragging-y')
        	.attr('y',function(d){
                var e=d3.select(this);
                var y= parseFloat(e.attr('gy'))+dy;
                e.attr('gy',y);
                return y;//y+ _this.scales.gridY.bandwidth() / 2;
            });	
        _this.demoTitles.selectAll('.dragging-y')
            .attr('y',function(d){
                var e=d3.select(this);
                var y= parseFloat(e.attr('gy'))+dy;
                e.attr('gy',y);
                return y;//y+ _this.scales.gridY.bandwidth() / 2;
            }); 
                    
        
        var X = _this.scales.gridX.domain().sort(function (a, b) {
            var ac = sample == a ? x : _this.scales.gridX(a);
            var bc = sample == b ? x : _this.scales.gridX(b);
            return ac - bc;
        });
        
        var Y = _this.scales.gridY.domain().sort(function (a, b) {
            var ac = key == a ? y : _this.scales.gridY(a);
            var bc = key == b ? y : _this.scales.gridY(b);
            return ac - bc;
        });
        var dY = _this.scales.demographicsY.domain().sort(function (a, b) {
            var ac = key == a ? y : _this.scales.demographicsY(a);
            var bc = key == b ? y : _this.scales.demographicsY(b);
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
        _this.data.sampleorder = _this.scales.gridX.domain();
        _this.data.geneorder = _this.scales.gridY.domain();
        _this.data.demoorder = _this.scales.demographicsY.domain();
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

    function setupMutationFileDescription() {
        var m = $('#mutation-file-info .mutation-file-description');
        if (m.length == 0) {
            m = $('<div>', { class: 'mutation-file-description' }).appendTo('#mutation-file-info');
        }
        m.text(_this.data.genomic.source+': ' +_this.data.genomic.samples.length+' samples, '+_this.data.genomic.genes.length+' genes loaded');
        $('.add-data-button').show();
    }
    function setupDemographicFileDescription(){
    	var d = $('#demographic-file-info .demographic-file-description');
        if (d.length == 0) {
            d = $('<div>', { class: 'demographic-file-description' }).appendTo('#demographic-file-info');
        }
        d.text(_this.data.demographics.datasource+': '+_this.data.demographics.samples.length+' samples, '+_this.data.demographics.fields.length+' fields');
        $('.add-data-button').show();
        _this.options.demofields = _this.data.demographics.fields.map(function (x) { return x.field; });
    }
    function setupMutationConfig(){
    	var list = $('#gene-fields').empty(); 
    	var genes = _this.data.genomic.genes.map(function(x){return x.key} ).sort();
    	$.each(genes, function(index,gene){
    		var d = $('<div>').appendTo(list);
    		var showGene = true;
    		if(_this.options.genesToPlot) showGene = _this.options.genesToPlot.includes(gene); //show/hide based on saved config
    		$('<input>',{class:'gene-checkbox',type:'checkbox',checked:showGene}).data('gene',gene).appendTo(d);
    		$('<span>').text(gene).appendTo(d);
    	});
    }
    function setupDemographicsConfig() {
        var d = $('#demographics-fields');
        d.empty();
        var num = _this.data.demographics.fields.length;
        $.each(_this.data.demographics.fields, function (ii, v) {
			   if (v.field == 'sample') return;
			   
			   var options;
				if(v.options){
					options = v.options;
				}
				else{
					options = {field: v.field, display: true, values:[]};
					var unique_values = v.values.filter(function (v, i, s) { return s.indexOf(v) === i; }).sort(function(a,b){return a.localeCompare(b)});
					var numvals = unique_values.length;
					unique_values.forEach(function (e, i) {
	                options.values.push({value: e, color:[360 / num * ii, 25+75 * (1-i / numvals), 25+75*(1-i/numvals) ] });
	            });
				}			   
            
            var vals = $('<div>').hide();
            
            options.values.forEach(function (e, i) {
                vals.append($('<span>').text(e.value + ': '));
                var cp = $('<input>', { class: 'colorpicker'}).data('value',e.value).appendTo(vals);
                vals.append('<br>');
                var color = new jscolor(cp[0]);
                if($.isArray(e.color)) color.fromHSV(e.color[0],e.color[1],e.color[2] );
                else color.fromString(e.color);
            });
            var cb = $('<input>', { class:'field', type: 'checkbox',checked:options.display }).data({ field: v.field, index: ii, target: vals }).appendTo(d);
            $('<span>').text(v.fieldNameOrig + ' (' + options.values.length + ' unique values)').appendTo(d);
            $('<button>').text('Colors').appendTo(d).on('click', function () {
            		vals.toggle();
                /*if (vals.is(':hidden')) vals.show();
                else vals.hide();*/
            });
            vals.appendTo(d);
            $('<br>').appendTo(d);
            
        });
    }
    function setupAlterationConfig(){
    	var alterationSetup = $('#alteration-setup').empty();
    	$.each(_this.options.mutTypeEncoding,function(k,v){
        	addAlterationConfig(k,v,alterationSetup);
        });
     }
    function updateOptions() {
    	
    	//Update layout options
    	_this.options.grid.cellwidth = Number(_this.optionsEditor.gridCellWidth.val());
    	_this.options.grid.cellheight = Number(_this.optionsEditor.gridCellHeight.val());
    	_this.options.grid.padding = Number(_this.optionsEditor.gridPadding.val());
    	_this.options.grid.maxgridwidth = Number(_this.optionsEditor.gridMaxWidth.val());
    	_this.options.bar.width = Number(_this.optionsEditor.barPlotWidth.val());
    	_this.options.colorLegend.width = Number(_this.optionsEditor.colorLegendWidth.val());
    	_this.options.geneLegend.width = Number(_this.optionsEditor.geneLegendWidth.val());
    	_this.options.sampleLegend.show = _this.optionsEditor.sampleLegendShow.prop('checked');
    	_this.options.sampleLegend.height = Number(_this.optionsEditor.sampleLegendHeight.val());
    	_this.options.innerLayout.margins = Number(_this.optionsEditor.innerMargins.val());
        
        //Update alteration encoding
        $('.alteration-config').each(function(i,e){
        	e=$(e);
        	var alteration = e.data('alteration');
        	_this.options.mutTypeEncoding[alteration].color='#'+e.find('.colorpicker').val();
        	_this.options.mutTypeEncoding[alteration].text = e.find('.alteration-legend').val();
        });
        
        //Update Demographic fields color and filter based on options gui values
        $('#demographics-fields .field').each(function (i, e) {
            e = $(e);
            var values = [];                
             e.data('target').find('.colorpicker').each(function (ii, ee) {
                 ee = $(ee);
                 values[ii] = { value: ee.data('value'), color: '#' + ee.val() };
             });
             var i = e.data('index');
             _this.data.demographics.fields[i].options={ field: e.data('field'), values: values, display:e.prop('checked') };
        });
        
        //demographics filter
        _this.options.demofields = _this.data.demographics.fields.reduce(function(arr, current){
        	var current_field = current.field;
        	if(current.options.display) arr.push(current_field);
        	return arr;
        },[]);
        
        //gene filter
        _this.options.genesToPlot = _this.data.genomic.genes.reduce(function(arr,current_gene){
        	var current_opt = $('#gene-fields .gene-checkbox').filter(function(index,checkbox){ return $(checkbox).data('gene')==current_gene.key; });
        	if(current_opt.is(':checked')) arr.push(current_gene.key);
        	return arr;
        },[]); 
    }
	function setupModeControls(){
		//add div container for controls (eg interactive mode options)
       var ctrls = $('<div>', { class: 'comut-ctrls' }).appendTo(_this.widget);
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
	}
	function setupTooltip(){
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
    }
	function setupSVGDownload(){
        var downloadOverlay = $('<div>',{class:'comut-download-overlay'}).appendTo('body').on('click',function(){
            $(this).hide();
        }).hide();
        var downloadBackground = $('<div>',{class:'comut-download-background'}).appendTo(downloadOverlay);
        $('<div>',{class:'comut-download-box'}).appendTo(downloadOverlay).append(
            $('<a>', { class: 'file-download', download: 'comut.svg' }).text('Click here to save your file') );
        
        var downloadSVG = $('<button>').text('Save SVG').on('click', function () {
            var svgstring = makeSVGString();
            var href = makeFile(svgstring,'text/svg');
            downloadOverlay.find('.file-download').attr('href', href).attr('download','comut.svg');
            downloadOverlay.show();
            
        }).appendTo($('.save-data'));
	}
	function makeSVGString(){
		var svgstring = '<?xml version="1.0" standalone="no"?>\
            <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\
            <svg xmlns="http://www.w3.org/2000/svg">' + $('#comut-svg').html() + "</svg>";
      return svgstring;
	}
    var downloadableFile = null;
    function makeFile(content,type) {
        var data = new Blob([content], { type: type });

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (downloadableFile !== null) {
            window.URL.revokeObjectURL(downloadableFile);
        }

        downloadableFile = window.URL.createObjectURL(data);

        // returns a URL you can use as a href
        return downloadableFile;
    };
    function setData(m,d,datasource){
		  if(m) {
		  	processMutationData(m,datasource);
		  	associateDemographicsWithSamples();	
          setupMutationFileDescription();
          setupMutationConfig();   
		  }
		  if(d) {
		  	processDemographicData(d,datasource);
		  	associateDemographicsWithSamples();	
          setupDemographicFileDescription();
	       setupDemographicsConfig();   		   
		  }
	  };
	  
	  function saveData(event, datastruct){
	  	  if(datastruct){
	  	     datastruct.data = _this.data;
	  	     return datastruct;
	  	  }
	  	  else{
	  	  	  datastruct = {
	  	  	  	data: _this.data,
	  	  	  };
	  	  	  saveJSON(datastruct,'comut-data.json');
	  	  }
	  };
	  function saveConfig(event, datastruct){
	  	  if(datastruct){
	  	     datastruct.config = _this.options;
	  	     return datastruct;
	  	  }
	  	  else{
	  	  	  datastruct = {config: _this.options};
	  	  	  saveJSON(datastruct,'comut-config.json');
	  	  }
	  };
	  function saveDataAndConfig(event){ 
	    var datastruct = {};
	  	 datastruct = saveData(event, datastruct); 
	  	 datastruct = saveConfig(event, datastruct);
	  	 saveJSON(datastruct,'comut-state.json');
	 };
	 function saveJSON(obj, filename){
	 	var url = makeFile(JSON.stringify(obj), 'text/json');
	  	var downloadOverlay = $('.comut-download-overlay');
	  	downloadOverlay.find('.file-download').attr('href', url).attr('download',filename);
		downloadOverlay.show();
	 }
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
                i++;
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
                	var geneArrayPos = getIndexPos(gData.gene, geneList);;
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
            if (array[i][0] == lookUpValue.toUpperCase() || array[i][0] == lookUpValue) {
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
		var nonstandardMutTypes=[];
		for (var i = 1; i < rows.length; i++) {
			var rowDataArr = rows[i];            
			var jsonObj = { };
			if (rowDataArr.length > 0) { // if row is empty exclude it				
				for (j = 0; j < colNames.length; j++) {
					if (rowDataArr[j] == undefined) { // if a field in a row is empty then put in a blank entry
						jsonObj[colNames[j].toString().trim()] = '';
					}
					else {
                        if (colNames[j] == "type") { //for the column "type" convert the contents to lower case
                            //check for valid mutation type names
                            var inputMutType = rowDataArr[j].toString().toLowerCase().trim();

                            if (_this.options.mutTypeEncoding[inputMutType] == undefined && inputMutType.trim() != '') {
                                //alert('Incorrect mutation type detected. ' + inputMutType);
                                //return false;
                                _this.options.mutTypeEncoding[inputMutType]={ "color": "#A2A2A2", "text": inputMutType,"legendOrder":100 };
                                //_this.optionseditor.val(JSON.stringify(_this.options,null,2));
                                addAlterationConfig(inputMutType,_this.options.mutTypeEncoding[inputMutType],$('#alteration-setup'));
                                
                                nonstandardMutTypes.push(rowDataArr[j].toString());
                            }
                            jsonObj[colNames[j].toString().trim()] = rowDataArr[j].toString().toLowerCase();
                        }
                        else {
                            jsonObj[colNames[j].toString().trim()] = rowDataArr[j].toString();
                        }
                        
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
		if(nonstandardMutTypes.length>0){
			alert('Non-standard mutation/alteration type(s)) detected: ' + nonstandardMutTypes.join(', ') + '. Use the option editor to configure these types. If they are due to typos in' +
			'the data, please remedy and reload the text file.'  );
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
	function getAlterationTypes(cells){
		alterations = [];
		$.each(cells,function(i,e){
			$.each(e.alterations,function(i,a){
				if(!alterations.includes(a.type)) alterations.push(a.type);
			});
		});
		return alterations;
	}
	function addAlterationConfig(type,obj,alterationSetup){
		var d = $('<div>',{class:'alteration-config'}).appendTo(alterationSetup).data('alteration',type);
	  	$('<label>',{class:'alteration-type'}).text(type).appendTo(d);
	  	$('<label>').appendTo(d).text('Legend:');
	  	$('<input>',{class:'alteration-legend'}).appendTo(d).val(obj.text)
	  	$('<label>').appendTo(d).text('Color:');
	  	var cp = $('<input>', { class: 'colorpicker'}).appendTo(d);
	    var color = new jscolor(cp[0]);
	    var colorString = obj.color;
	    if(colorString[0]=='#') colorString = colorString.slice(1);
	    color.fromString(colorString);
							          
	}
}

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {

      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        // c. Increase k by 1. 
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}


// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});

