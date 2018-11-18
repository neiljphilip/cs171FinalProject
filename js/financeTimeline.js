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

    vis.margin = { top: 40, right: 40, bottom: 40, left: 70 };

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
        .scale(vis.x);

    vis.yAxis = d3.axisLeft()
        .scale(vis.y)
        .ticks(10);

    // Axes groups
    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    // Labels
    vis.svg.append("text")
        .attr("x", -40)
        .attr("y", -8)
        .attr('class', 'axis-label')
        .text("Crypto Valuations");

    vis.svg.append('g')
        .attr('class', 'axis-label')
        .append('text')
        .attr('x', -1 * vis.height + 60)
        .attr('y', -50)
        .attr('transform', 'rotate(-90)')
        .text('Valuation (USD)');

    // Line svg
    vis.lineSvg = vis.svg.append('g')
        .append('path')
        .attr('class', 'finance-line');

    // Candlesticks svg
    vis.candlesSvg = vis.svg.append('g')
        .attr('class', 'candlesticks-group');

    // Initialize filters
    vis.updateCoin("bitcoin");
    vis.updateView("historical");

    // Initialize brushing component
    vis.currentBrushRegion = null;
    vis.brush = d3.brushX()
        .extent([[0, 0], [vis.width, vis.height]])
        .on("brush", function(){
            // User just selected a specific region
            vis.currentBrushRegion = d3.event.selection;
            vis.currentBrushRegion = vis.currentBrushRegion.map(vis.x.invert);

            // 3. Trigger the event 'selectionChanged' of our event handler
            $(vis.eventHandler).trigger("selectionChanged", vis.currentBrushRegion);
        });

    // Append brush component here
    vis.brushGroup = vis.svg.append("g")
        .attr("class", "brush");

    // (Filter, aggregate, modify data)
    vis.onUpdateFilters();
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

    vis.x.domain(d3.extent(vis.displayData, function(d) { return d.Date; }));
    if (vis.chosenView === 'historical') {
        vis.y.domain(d3.extent(vis.displayData, function(d) { return d.Open; }));

        // Call brush component here
        vis.brushGroup.call(vis.brush)
            .attr("clip-path", "url(#clip)");

        $('.brush').show();
    } else {
        var minPrice = d3.min(vis.displayData, function(d) { return d.Low; });
        var maxPrice = d3.max(vis.displayData, function(d) { return d.High; });
        vis.y.domain([0.98 * minPrice, 1.02 * maxPrice]);

        $('.brush').hide();
    }

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

    if (vis.chosenView === 'historical') {
        $('.candlesticks-group').empty();
    } else {
        var barWidth = 6;
        var lineWidth = 1;

        // Don't show candlestick at edge of data
        var barData = vis.displayData;
        barData.pop();
        barData.shift();

        // Draw the rectangles for the candlesticks
        vis.candleBars = vis.candlesSvg.selectAll('rect.candlestick-rect')
            .data(barData, function(d) { return d.Date; });

        vis.candleBars.enter()
            .append('rect')
            .attr('class', 'candlestick-rect')
            .merge(vis.candleBars)
            .transition()
            .duration(800)
            .attr('x', function(d) { return vis.x(d.Date) - (barWidth / 2); })
            .attr('y', function(d) {
                if (d.Open >= d.Close) {
                    return vis.y(d.Open);
                }
                return vis.y(d.Close);
            })
            .attr('width', barWidth)
            .attr('height', function(d) {
                if (d.Open >= d.Close) {
                    return vis.y(d.Close) - vis.y(d.Open);
                }
                return vis.y(d.Open) - vis.y(d.Close);
            })
            .attr('class', function(d) {
                if (d.Open >= d.Close) {
                    return 'candlestick-rect red';
                }
                return 'candlestick-rect green';
            });

        vis.candleBars.exit()
            .remove();

        // Draw the lines for the candlesticks
        vis.candleLines = vis.candlesSvg.selectAll('rect.candlestick-line')
            .data(barData, function(d) { return d.Date; });

        vis.candleLines.enter()
            .append('rect')
            .attr('class', 'candlestick-line')
            .merge(vis.candleLines)
            .transition()
            .duration(800)
            .attr('x', function(d) { return vis.x(d.Date) - (lineWidth / 2); })
            .attr('y', function(d) {
                return vis.y(d.High);
            })
            .attr('width', lineWidth)
            .attr('height', function(d) {
                return vis.y(d.Low) - vis.y(d.High);
            })
            .attr('class', function(d) {
                if (d.Open >= d.Close) {
                    return 'candlestick-line red';
                }
                return 'candlestick-line green';
            });

        vis.candleLines.exit()
            .remove();
    }

    /* Draw vis using vis.displayData */

    // Enter, update, exit

    // Draw axes (if applicable)

    // Draw legend (if applicable)
};

/*
 * Filtering function - only necessary if this visualization is filtered based on some mechanic
 * E.g. brush, inputs, event trigger from another visualization in the dashboard (apply parameters as necessary)
 */

FinanceTimeline.prototype.onCoinChanged = function(coin) {
    var vis = this;
    vis.updateCoin(coin);
    vis.onUpdateFilters();
};

FinanceTimeline.prototype.onViewChanged = function(view) {
    var vis = this;
    vis.updateView(view);
    vis.onUpdateFilters();
};

FinanceTimeline.prototype.updateCoin = function(coin) {
    var vis = this;

    // Update vis.filteredData
    vis.chosenCoin = coin;
    vis.coinData = vis.data.filter(function(d) { return d.Coin === vis.chosenCoin; });
};

FinanceTimeline.prototype.updateView = function(view) {
    var vis = this;

    // Update vis.filteredData
    vis.chosenView = view;
    // Historical defaults to entire view of coin
    if (view === "historical") {
        $('.detailed-inputs').hide();
        vis.initHistorical();
    } else { // Detailed view defaults to current month
        $('.detailed-inputs').show();
        vis.initDetailed();
    }
};

/* Handles event brush triggers for Historical view */
FinanceTimeline.prototype.initHistorical = function(selectionStart, selectionEnd) {
    var vis = this;

    var dataRange = d3.extent(vis.coinData, function(d) { return d.Date; });
    vis.selectionStart = dataRange[0];
    vis.selectionEnd = dataRange[1];
};

/* Handles event month changes for Detailed view */
FinanceTimeline.prototype.initDetailed = function() {
    var vis = this;

    // Initialize to last month of that coin's data
    var date = d3.max(vis.coinData, function(d) { return d.Date; });
    // Show 4 months in detailed view
    var firstDay = new Date(date.getFullYear(), date.getMonth() - 3, 1);
    var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    vis.selectionStart = firstDay;
    vis.selectionEnd = lastDay;

    vis.updateDetailInputs(vis.selectionStart, vis.selectionEnd);
};

FinanceTimeline.prototype.updateDetailInputs = function(start, end) {
    var vis = this;

    var dateFormatter = d3.timeFormat("%Y");
    var firstDate = monthNames[start.getMonth()] + ", " + dateFormatter(start);
    var secondDate = monthNames[end.getMonth()] + ", " + dateFormatter(end);
    $('#detailed-month').text(firstDate + ' - ' + secondDate);

    var isMoreForward = d3.max(vis.coinData, function(d) { return d.Date; }) > end;
    var isMoreBackward = d3.min(vis.coinData, function(d) { return d.Date; }) < start;

    if (isMoreForward && $('#detailed-month-next').hasClass('disabled')) {
        $('#detailed-month-next').removeClass('disabled');
    } else if (!isMoreForward  && !$('#detailed-month-next').hasClass('disabled')) {
        $('#detailed-month-next').addClass('disabled');
    }

    if (isMoreBackward && $('#detailed-month-prev').hasClass('disabled')) {
        $('#detailed-month-prev').removeClass('disabled');
    } else if (!isMoreBackward  && !$('#detailed-month-prev').hasClass('disabled')) {
        $('#detailed-month-prev').addClass('disabled');
    }
};

FinanceTimeline.prototype.updateDetailed = function(moveForward) {
    var vis = this;

    // Move forward or backward 4 months
    var monthsToMove = moveForward ? 4 : -4;

    vis.selectionStart = vis.selectionStart.add(monthsToMove).month();
    vis.selectionEnd = vis.selectionEnd.add(monthsToMove).month();

    vis.updateDetailInputs(vis.selectionStart, vis.selectionEnd);
    vis.onUpdateFilters();
};

FinanceTimeline.prototype.onUpdateFilters = function() {
    var vis = this;

    // Filtering down to correct time data
    vis.filteredData = vis.coinData.filter(function(d){
        return d.Date >= vis.selectionStart && d.Date <= vis.selectionEnd;
    });

    vis.wrangleData();
};