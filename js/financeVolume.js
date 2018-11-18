/*
 * FinanceVolumeChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data	    		-- the actual data: perDayData
 * @param _eventHandler     -- event handler for this visualization (perhaps not necessary if a vis only reacts to, not triggers, events)
 */
FinanceVolumeChart = function(_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.filteredData = this.data;

    this.initVis();
};

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

FinanceVolumeChart.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 40, right: 40, bottom: 40, left: 100 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 300 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // SVG clipping path
    vis.svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height);

    // Scales, axes, and domains
    vis.x = d3.scaleTime()
        .range([0, vis.width]);

    vis.y = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x)
        .ticks(5);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    // Initialize stack layout
    vis.stack = d3.stack()
        .keys(coinColorScale.domain());

    // Labels
    vis.svg.append("text")
        .attr("x", -80)
        .attr("y", -10)
        .attr('class', 'axis-label y-axis-label');

    // Group for the stacked area chart
    vis.pathSvg = vis.svg.append('g')
        .attr('class', 'path-group');

    // Tooltip
    vis.focus = vis.svg.append('g')
        .style('display', 'none');
    vis.bisectDate = d3.bisector(function(d) { return new Date(d.key); }).left;

    vis.focus.append('line')
        .attr('class', 'tooltip-line')
        .attr('y1', 40)
        .attr('y2', vis.height)
        .style("stroke", "whitesmoke");

    vis.tooltip = vis.focus.append('g')
        .attr('class', 'tooltip-block');

    vis.tooltipRectWidth = 200;
    vis.tooltipRect = vis.tooltip.append('rect')
        .attr('class', 'tooltip-rect')
        .attr('width', vis.tooltipRectWidth)
        .attr('height', vis.height - 20)
        .attr('rx', 10)
        .attr('ry', 10);

    vis.tooltipText = vis.tooltip.append('g')
        .attr('class', 'tooltip-text');

    vis.svg.append('rect')
        .attr('class', 'focus-rect')
        .attr('width', vis.width)
        .attr('height', vis.height)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mouseover', function() { vis.focus.style('display', null); })
        .on('mouseout', function() { vis.focus.style('display', 'none'); })
        .on('mousemove', mousemove);

    function mousemove() {
        var x0 = vis.x.invert(d3.mouse(this)[0]),
            i = vis.bisectDate(vis.filteredData, x0, 1),
            d0 = vis.filteredData[i - 1],
            d1 = vis.filteredData[i],
            d = x0 - d0.date > d1.date - x0 ? d1 : d0,
            date = new Date(d.key);

        var numCoins = 0;
        for (var coinI in allCoins) {
            var coin = allCoins[coinI];
            if (d.value.hasOwnProperty(coin)) {
                numCoins += 1;
            }
        }

        var formatTime = d3.timeFormat('%d, %Y');
        vis.focus.select('line.tooltip-line')
            .attr('transform', 'translate(' + vis.x(date) + ',0)');

        var tooltipAlignment = vis.x(date) < vis.width / 2 ? 0 : -1 * vis.tooltipRectWidth;

        vis.tooltipText.selectAll("*").remove();
        vis.tooltipRect
            .attr('transform', 'translate(' + (vis.x(date) + tooltipAlignment) + ',10)')
            .attr('height', numCoins * 15 + 30);
        vis.tooltipText.append('text')
            .attr('class', 'tooltip-date')
            .attr('transform', 'translate(' + (vis.x(date) + 10 + tooltipAlignment) + ',' + 30 + ')')
            .text(monthNames[date.getMonth()] + " " + formatTime(date));

        var j = 1;
        for (var coinI in allCoins) {
            var coin = allCoins[coinI];

            if (d.value.hasOwnProperty(coin)) {
                var coinData = d.value[coin];
                var valueText = '';
                if (vis.chosenView === 'absolute') {
                    valueText = d3.format("($,.0f")(coinData.Volume);
                } else {
                    valueText = d3.format(".2r")(coinData.VolumePercent) + '%';
                }
                vis.tooltipText.append('text')
                    .attr('id', coin + '-label')
                    .attr('class', ' tooltip-text')
                    .attr('transform', 'translate(' + (vis.x(date) + 10 + tooltipAlignment) + ',' + (j * 15 + 30) + ')')
                    .text(coin);
                vis.tooltipText.append('text')
                    .attr('id', coin + '-value')
                    .attr('class', ' tooltip-text')
                    .attr('transform', 'translate(' + (vis.x(date) + 100 + tooltipAlignment) + ',' + (j * 15 + 30) + ')')
                    .text(valueText);
                j += 1;
            }
        }
    }

    // (Filter, aggregate, modify data)
    vis.onUpdateView('absolute');
};

/*
 * Data wrangling
 */

FinanceVolumeChart.prototype.wrangleData = function() {
    var vis = this;

    var volumeByData = [];
    vis.filteredData.forEach(function(d) {
        var volumeDataObj = {};
        volumeDataObj.date = new Date(d.key);
        var coinVolumes = d.value;
        for (var coinI in allCoins) {
            var coin = allCoins[coinI];
            if (coinVolumes.hasOwnProperty(coin)) {
                if (vis.chosenView === 'absolute') {
                    volumeDataObj[coin] = coinVolumes[coin].Volume || 0;
                } else {
                    volumeDataObj[coin] = coinVolumes[coin].VolumePercent || 0;
                }
            } else {
                volumeDataObj[coin] = 0.0;
            }
        }
        volumeByData.push(volumeDataObj);
    });

    // Rearrange data
    vis.stackedData = vis.stack(volumeByData);

    // Perform any data manipulation if necessary on the filtered data
    vis.displayData = vis.stackedData;

    // Stacked area layout
    vis.area = d3.area()
        .curve(d3.curveCardinal)
        .x(function(d) { return vis.x(d.data.date); })
        .y0(function(d) { return vis.y(d[0]); })
        .y1(function(d) { return vis.y(d[1]); });

    // Update the visualization
    vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

FinanceVolumeChart.prototype.updateVis = function() {
    var vis = this;

    // Update domains
    vis.x.domain(d3.extent(vis.filteredData, function(d) { return new Date(d.key); }));
    if (vis.chosenView === 'absolute') {
        // Get the maximum of the multi-dimensional array or in other words, get the highest peak of the uppermost layer
        vis.y.domain([0, d3.max(vis.displayData, function(d) {
            return d3.max(d, function(e) {
                return e[1];
            });
        })
        ]);
    } else {
        vis.y.domain([0, 100]);
    }

    var dataCategories = coinColorScale.domain();

    // Draw the layers
    vis.categories = vis.pathSvg.selectAll(".area")
        .data(vis.displayData);

    vis.categories.enter()
        .append("path")
        .attr("class", "area")
        .merge(vis.categories)
        .style("fill", function(d,i) {
            return coinColorScale(dataCategories[i]);
        })
        .style("pointer-events", "none")
        .attr("d", function(d) {
            return vis.area(d);
        });

    vis.categories.exit().remove();


    // Call axis functions with the new domain
    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);

    /* Draw vis using vis.displayData */

    // Enter, update, exit

    // Draw axes (if applicable)

    // Draw legend (if applicable)
};

/*
 * Filtering function - only necessary if this visualization is filtered based on some mechanic
 * E.g. brush, inputs, event trigger from another visualization in the dashboard (apply parameters as necessary)
 */

FinanceVolumeChart.prototype.onUpdateData = function(selectionStart, selectionEnd) {
    var vis = this;

    // Update vis.filteredData
    vis.filteredData = vis.data.filter(function(d) { return new Date(d.key) >= selectionStart && new Date(d.key) <= selectionEnd });

    vis.wrangleData();
};

FinanceVolumeChart.prototype.onUpdateView = function(view) {
    var vis = this;
    vis.chosenView = view;

    if (view === 'absolute') {
        d3.select('.y-axis-label').text('Volume (USD)');
    } else {
        d3.select('.y-axis-label').text('Volume (%)');
    }

    vis.wrangleData();
};