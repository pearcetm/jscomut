# jscomut
jscomut is a javascript widget that creates interactive co-mutation plots in the web browser using d3.js. The widget allows mutation and demographic data to be loaded locally from a text file without uploading to the web, sorted interactively, and exported to a .svg file.

This guide contains information for:
- [developers](#For-developers): how to add the widget and interact with it using javascript
- [users](#For-users): how to use the widget to interact with your data

# For developers
## Adding the widget to a webpage
### Include the following scripts:
- jQuery
- d3.js (version 4)
- jscomut.js
- your own javascript, which calls `new Comut();` (see below)

### Instantiate the widget
When jscomut.js is executed, a constructor function named `Comut` is added to the global workspace. Call this function to create an instance of the widget.
```javascript
var widget = new Comut();
```
## Application programming interface
The widget provides functions so that user scripts can interact in certains ways.
- [init()](#init())
- [randomize()](#randomize())
- [sort()](#sort())

### init()
Initializes the widget, creating html and svg elements for data visualization and graphical user interface.

Creating a widget with all default values is as simple as calling `init()` with no arguments:
```javascript
widget.init();
```
By default, `init` creates a `<div class='comut'></div>` which contains the widget, and appends it to the body of the page. This behavior can be customized by providing a selector for a target element. This, and other configuration options, are discussed in detail below.

#### Configuration options
The widget can be configured by passing in a structure with desired options defined as fields. The structure is then merged with default values (see below), so only non-default values need to be specified.

A full set of the default configuration options is below:
```javascript
default_options = {
        //target: a selector that defines where the widget is added.
        //default behavior is to create a div with class='comut' and append it to the body of the document.
        target: '',
        
        //grid: defines the geometry of the gene/alteration grid
        //cellwidth: width of each cell in pixels
        //cellheight: height of each cell in pixels
        //maxgridwidth: the grid will grow depending on the number of samples; the total grid width is capped at this value...
        //  and the grid can be zoomed in/out if there are more samples than can fit in the max size.
        //padding: padding between cells in pixels
        grid: {
            cellwidth: 20,
            cellheight: 30,
            maxgridwidth:500,
            padding:1,
        },
        
        //bar: defines the geometry (width only) of the bar graph of alteration frequency, to the left of the grid
        bar: {
            width: 200,
            //height: same as grid because the data is the same
        },
        
        //geneLegend: defines the geometry (width only) of the text legend of the gene names, left of the grid
        geneLegend: {
            width: 70,
        },
        
        //sampleLegend: defines the height of the sample legend above the grid. show:'no' will hide the legend.
        sampleLegend:{
            
            height: 100,
            show:'yes',//if not 'yes' a scale of zero will hide the labels
        },
        
        //colorLegend: defines the width of the legend of cell colors to the right of the grid.
        colorLegend:{
            width:200,
        },
        //innerLayout: pixels between the grid and the legend, bar graph, etc.
        innerLayout:{
            margins:5,
        },
        
        //colorcodes: defines the color of the cells representing each type of alteration
        colorcodes: {
            0: '#D4D4D4', //No alteration - #D4D4D4 (gray)
            1: '#0F8500', //Missense - #0F8500 (green)
            2: '#000000', //Truncating (stop gain) - #000000 (black)
            3: '#5E2700', //Truncating (frameshift index) - #5E2700 (dark brown)
            4: '#C973FF', //Inframe indels - #C973FF (purple)
            5: '#F57564', //Splice site - #F57564 (orange)
            6: '#2129FF', //Amplification - #2129FF (blue)
            7: '#ff0000', //deletion - #ff0000 (red)
            8: '#00BFFF', //Fusion - #00BFFF (pale blue) triangle
            wt: '#D4D4D4', //No alteration - #D4D4D4 (gray)
            missense: '#0F8500', //Missense - #0F8500 (green)
            stop: '#000000', //Truncating (stop gain) - #000000 (black)
            fs: '#5E2700', //Truncating (frameshift index) - #5E2700 (dark brown)
            indel: '#C973FF', //Inframe indels - #C973FF (purple)
            inframe: '#C973FF', //Inframe indels - #C973FF (purple)
            splice: '#F57564', //Splice site - #F57564 (orange)
            amp: '#2129FF', //Amplification - #2129FF (blue)
            del: '#ff0000', //deletion - #ff0000 (red)
            fusion: '#00BFFF', //Fusion - #00BFFF (pale blue) triangle
        },
        
        //legend: maps numeric codes into textual representation of alteration types
        legend: [
            { colorcode: 1, title: 'Missense' },
            { colorcode: 2, title: 'Stop gain' },
            { colorcode: 3, title: 'Frameshift' },
            { colorcode: 4, title: 'Inframe' },
            { colorcode: 5, title: 'Splice site' },
            { colorcode: 6, title: 'Amplification' },
            { colorcode: 7, title: 'Deletion/loss' },
            { colorcode: 8, title: 'Fusion' },
            { colorcode: 0, title: 'No alteration' }
        ],
        
        //fileSource: 'local' - load data from the client filesystem. Not actually used
        fileSource: 'local',
        
        //fileFields: allows using differently-named columns in the data file to be used for defining sample, gene, and
        //  alteration type.
        fileFields: {
            sample: 'sample',
            gene: 'gene',
            value: 'type',
        },
        
        //dataInput: data can be loaded using a filepicker or pastebox
        dataInput: {
            filePicker: true,//if true, adds a button to select a file
            pasteBox:true,//if true, adds a textinput for copy/paste
        }
    };
```

#### Example: initalize the widget with some non-default geometry options and an existing html target
```javascript
var options = {
        grid: {
                cellwidth: 40, 
                maxgridwidth: 800 
        },
        geneLegend: { width: 100 },
        target: '#comut-widget-container'
};
widget.init(options);
```

### randomize()
The randomize function shuffles the gene and sample order, and redraws the widget. This can be triggered by a button click, for example.
```javascript
//trigger the randomize function by clicking a button
var button = $('#randomize-button');
button.on('click', widget.randomize);

//or it can be called directly
widget.randomize();
```

### sort()
The sort function organizes the data according to either the gene alteration frequency, the sample alterations, or both. A struct passed as an argument defines which axes to sort along. 

```javascript
//sort the genes by alteration frequency
var button = $('#sort-genes');
button.on('click', function(){
        widget.sort({x:true});
});

//sort the samples by presence/absence of alterations, according to the current gene order
var button = $('#sort-samples');
button.on('click', function(){
        widget.sort({y:true});
});

//sort the genes by alteration frequency, then sort the samples
var button = $('#sort-genes-and-samples');
button.on('click', function(){
        widget.sort(); //equivalent to widget.sort({x:true, y:true})
});

```

# For users
So you have a webpage with the widget installed. Congratulations! How does this thing work?

First, and this is important: *Your data stays completely in your control.* It does not get uploaded to a server; it comes from your computer and all the processing is done right in the browser, without sending it over the internet. This means you can safely use the widget without losing confidentiality, until you're ready to distribute your findings.

Let's get started.
## Add your data and pick some configuration options
1) Click the **Configure widget** button to get started
2) Select a file with the mutations/alterations:
  1) Click the button to choose a file from your computer, or copy-paste your data into the text box.
3) Do the same for additional demographic data, if desired
  1) Select which types of data to display, and which colors should go with each value
4) Once you're satisfied, click the **Create widget** button.

## Use the different interaction modes to explore your data
Once your data is drawn into the plot, you can start exploring. The *Drag-and-drop* mode lets you re-order the grid of data by clicking on the grid and moving vertically (to re-order the genes) and/or horizontally (to re-order the samples). If there are a lot of samples and the grid is compressed, the *Pan and zoom* mode lets you zoom in and move around inside the grid. Choosing *None* lets you safely click around on the graphic without worrying about moving things inadvertently.

If the widget is configured to let you automatically sort the data by genes or by samples, there may be buttons for this as well.

## Save your graphic to an svg file on your local computer.
Once you have ordered the data to your liking, you can use the **Create downloadable svg file** button to save your figure as a file on your computer. This process occurs entirely within the browser - even though the file is "downloaded" it is not being downloaded *over the internet*, it is simply being saved from the browser into a stand-alone file.
