/*
 * ExampleVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data	    		-- the actual data: perDayData
 * @param _eventHandler     -- event handler for this visualization (perhaps not necessary if a vis only reacts to, not triggers, events)
 */
TreeLineChart = function(_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.filteredData = this.data;

    this.initVis();
};

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

TreeLineChart.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 40, right: 40, bottom: 40, left: 70 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 250 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales, axes, and domains

    // set the ranges
    vis.x = d3.scaleTime().range([0, vis.width]);
    vis.y = d3.scaleLinear().range([vis.height, 0]);

    vis.valueLine = d3.line()
        .x(function(d) { return vis.x(d.date); })
        .y(function(d) { return vis.y(d.numCoins); });

    // (Filter, aggregate, modify data)
    vis.wrangleData();
};

/*
 * Data wrangling
 */

TreeLineChart.prototype.wrangleData = function() {
    var vis = this;

    vis.filteredData = vis.data.map(function(d) {
        var temp = {};
        var root = d3.hierarchy(d[1]);
            // .sort((a, b) => (a.height - b.height) || a.data.coin.localeCompare(b.data.name));
        temp['date'] = d[0];
        temp['numCoins'] = root.count().value;
        return temp;
    });

    // Perform any data manipulation if necessary on the filtered data
    vis.displayData = vis.filteredData;
    console.log(vis.displayData);

    // Update the visualization
    vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

TreeLineChart.prototype.updateVis = function() {
    var vis = this;

    /* Draw vis using vis.displayData */
    vis.x.domain(d3.extent(vis.displayData, function(d) { return d.date; }));
    vis.y.domain([0, d3.max(vis.displayData, function(d) { return d.numCoins; })])

    // Enter, update, exit

    vis.svg.append('path')
        .data([vis.displayData])
        .attr('class', 'tree-line')
        .attr('d', vis.valueLine);

    // Draw axes (if applicable)
    vis.svg.append('g')
        .attr('class', 'x-axis axis')
        .attr('transform', 'translate(0,' + vis.height + ')')
        .call(d3.axisBottom(vis.x));

    vis.svg.append('g')
        .attr('class', 'y-axis axis')
        .call(d3.axisLeft(vis.y));

    vis.svg.append('g')
        .attr('class', 'axis-label')
        .append('text')
        .attr('x', -1 * vis.height + 80 - 25)
        .attr('y', -50)
        .attr('transform', 'rotate(-90)')
        .text('# of Coins');

    vis.svg.append('text')
        .attr('class', 'axis-label caption-label')
        .attr('x', vis.width*.05)
        .attr('y', vis.height + vis.margin.bottom - 3)
        .text('Includes running & defunct coins.')

};

/*
 * Filtering function - only necessary if this visualization is filtered based on some mechanic
 * E.g. brush, inputs, event trigger from another visualization in the dashboard (apply parameters as necessary)
 */

TreeLineChart.prototype.updateVerticalLine = function(date, chart, i) {
    // var vis = this;

    // console.log(chart)
    let lineData = {};
    lineData['x'] = chart.x(date);
    lineData['y1'] = 0;
    lineData['y2'] = chart.height;

    let verticalLine = chart.svg.selectAll('.vertical-line')
        .data([lineData]);

    verticalLine.enter().append('line')
        .attr('class', 'vertical-line')
        .merge(verticalLine)
        .attr('x1', d => d.x)
        .attr('x2', d => d.x)
        .attr('y1', d => d.y1)
        .attr('y2', d => d.y2)
        .style('stroke', 'white');

    verticalLine.exit().remove();

    var treeDate = d3.timeFormat('%B %Y')(date);

    let coinNum = chart.displayData[i].numCoins;
    let tip = d3.tip().attr('class', 'd3-tip').html(`${treeDate}<br>Coins: ${coinNum}`);

    chart.svg.call(tip);

    let circleData = {};
    circleData['x'] = chart.x(date);
    circleData['y'] = chart.y(coinNum);

    chart.svg.append('circle')
        .attr('class', 'node-circle')
        .attr('cx', circleData.x)
        .attr('cy', circleData.y)
        .attr('r', 3)
        .attr('fill', 'white')
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);


};
