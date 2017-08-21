# jscomut
jscomut is a javascript widget that creates interactive co-mutation plots in the web browser using d3.js. The widget allows mutation and demographic data to be loaded locally from a text file without uploading to the web, sorted interactively, and exported to a .svg file.

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
### Initialize the widget to create the html and svg elements
Creating a widget with all default values is as simple as calling `init()` with no arguments:
```javascript
widget.init();
```
By default, `init` creates a `<div class='comut'></div>` which contains the widget, and appends it to the body of the page. This behavior can be customized by providing a selector for a target element. This, and other configuration options, are discussed in detail below.

## Configuration options
The widget can be configured by passing 
A full set of the default configuration options
```javascript
default_options = {
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
        fileSource: 'local',
        fileFields: {
            sample: 'sample',
            gene: 'gene',
            value: 'type',
        },
        dataInput: {
            filePicker: true,//if true, adds a button to select a file
            pasteBox:true,//if true, adds a textinput for copy/paste
        }
    };
```


## Application programming interface
