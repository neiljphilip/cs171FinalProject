/*
 * Choropleth - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data	    		-- the actual data: perDayData
 * @param _eventHandler     -- event handler for this visualization (perhaps not necessary if a vis only reacts to, not triggers, events)
 */
Choropleth = function(_parentElement, _data1, _data2, _mapData) {
    this.parentElement = _parentElement;
    this.data1 = _data1;
    this.data2 = _data2;
    this.mapData = _mapData;
    console.log(this.mapData);

    this.initVis();
};

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

Choropleth.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 40, right: 40, bottom: 40, left: 40 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500  - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales, axes, and domains

    // (Filter, aggregate, modify data)
    vis.wrangleData();
};

/*
 * Data wrangling
 */

Choropleth.prototype.wrangleData = function() {
    var vis = this;

    // Perform any data manipulation if necessary on the filtered data
    vis.displayData = vis.data1;
    console.log(vis.displayData);
    console.log(vis.mapData);
    vis.merc = topojson.feature(vis.mapData, vis.mapData.objects.countries).features;

    vis.projection = d3.geoOrthographic()
        .translate([vis.width / 2, vis.height / 2])
        .scale([100]);

// path generator
    vis.path = d3.geoPath()
        .projection(vis.projection);
    // Update the visualization
    vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

Choropleth.prototype.updateVis = function() {
    var vis = this;

    // Render the U.S. by using the path generator
    vis.svg.selectAll("path")
        .data(vis.merc)
        .enter().append("path")
        .attr("d", vis.path)
        .style("fill", "purple");
    /* Draw vis using vis.displayData */

    // Enter, update, exit

    // Draw axes (if applicable)

    // Draw legend (if applicable)
};

/*
 * Filtering function - only necessary if this visualization is filtered based on some mechanic
 * E.g. brush, inputs, event trigger from another visualization in the dashboard (apply parameters as necessary)
 */

Choropleth.prototype.onUpdateData = function() {
    var vis = this;

    // Update vis.filteredData

    vis.wrangleData();
};

