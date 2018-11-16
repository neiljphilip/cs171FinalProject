/*
 * FinanceTimeline - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data	    		-- the actual data: perDayData
 * @param _eventHandler     -- event handler for this visualization (perhaps not necessary if a vis only reacts to, not triggers, events)
 */
FinanceTimeline = function(_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.filteredData = this.data;

    this.initVis();
};

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

FinanceTimeline.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 40, right: 40, bottom: 40, left: 40 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 300 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales, axes, and domains
    vis.x = d3.scaleTime()
        .range([0, vis.width]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y)
        .ticks(10);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    vis.svg.append("text")
        .attr("x", -40)
        .attr("y", -8)
        .text("Crypto Valuations");

    vis.lineSvg = vis.svg.append('g')
        .append('path')
        .attr('class', 'finance-line');

    vis.candlesSvg = vis.svg.append('g')
        .attr('class', 'candlesticks-group');

    // (Filter, aggregate, modify data)
    vis.onUpdateData("bitcoin");
};

/*
 * Data wrangling
 */

FinanceTimeline.prototype.wrangleData = function() {
    var vis = this;

    // Perform any data manipulation if necessary on the filtered data
    vis.displayData = vis.filteredData;

    // Update the visualization
    vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

FinanceTimeline.prototype.updateVis = function() {
    var vis = this;
    console.log(vis.displayData);

    vis.x.domain(d3.extent(vis.displayData, function(d) { return d.Date; }));
    vis.y.domain(d3.extent(vis.displayData, function(d) { return d.Open; }));

    vis.line = d3.line()
        .x(function(d) { return vis.x(d.Date); })
        .y(function(d) { return vis.y(d.Open); });

    vis.lineSvg.datum(vis.displayData)
        .transition()
        .duration(800)
        .attr('d', vis.line);

    vis.lineSvg.exit()
        .remove();

    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);

    vis.bars = vis.candlesSvg.selectAll('rect')
        .data(vis.displayData);

    vis.bars.enter()
        .append('rect')
        .attr('class', 'candlestick')
        .merge(vis.bars)
        .attr('x', function(d) { return vis.x(d.Date); })
        .attr('y', function(d) { return vis.y(d.Low); })
        .attr('width', 5)
        .attr('height', function(d) { return vis.height - vis.y(d.High); });

    vis.bars.exit()
        .remove();

    /* Draw vis using vis.displayData */

    // Enter, update, exit

    // Draw axes (if applicable)

    // Draw legend (if applicable)
};

/*
 * Filtering function - only necessary if this visualization is filtered based on some mechanic
 * E.g. brush, inputs, event trigger from another visualization in the dashboard (apply parameters as necessary)
 */

FinanceTimeline.prototype.onUpdateData = function(coin) {
    var vis = this;

    // Update vis.filteredData
    vis.chosenCoin = coin;
    vis.filteredData = vis.data.filter(function(d) { return d.Coin === vis.chosenCoin; });

    vis.wrangleData();
};