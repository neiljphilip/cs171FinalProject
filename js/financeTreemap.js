/*
 * FinanceTreemap - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data	    		-- the actual data: perDayData
 * @param _eventHandler     -- event handler for this visualization (perhaps not necessary if a vis only reacts to, not triggers, events)
 */
FinanceTreemap = function(_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;

    this.initVis();
};

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

FinanceTreemap.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 40, right: 0, bottom: 40, left: 0 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 340 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.mapSvg = vis.svg.append('g')
        .attr('class', 'treemap');

    vis.svg.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .attr('class', 'axis-label')
        .text('Current Market Cap (USD)');

    vis.svg.append("text")
        .attr("x", vis.width)
        .attr("y", -10)
        .attr('class', 'axis-label anchor-right caption-label')
        .text('Click a box to select a currency.');

    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(function(d) {
           return "<div>" +
               "<p>" + d.data.coin + "</p>" +
               "<p>" + vis.formatBillions(d.data.value) + "</p>" +
               "</div>";
        });

    // (Filter, aggregate, modify data)
    vis.wrangleData();
};

/*
 * Data wrangling
 */

FinanceTreemap.prototype.wrangleData = function() {
    var vis = this;

    var marketCaps = [];
    for (var coinI in allCoins) {
        var coin = allCoins[coinI];
        var coinData = vis.data.filter(function(d) { return d.Coin === coin; });
        var latestDate = d3.max(coinData, function(d) { return d.Date; });
        var curMarketCap = coinData.filter(function(d) { return d.Date === latestDate; })[0].MarketCap;
        marketCaps.push({ coin: coin, value: curMarketCap, children: [] });
    }

    var hierarchyData = {
        coin: 'AllCoins',
        children: marketCaps
    };

    vis.displayData = d3.treemap()
        .size([vis.width, vis.height])
        .padding(1)
        .round(true)
        (d3.hierarchy(hierarchyData).sum(d => d.value).sort((a,b) => b.value - a.value))
        .descendants();

    // Update the visualization
    vis.updateVis();
};

FinanceTreemap.prototype.formatBillions = function(value) {
    var billionsFormatter = d3.format("0.2s");
    return '$' + billionsFormatter(value).replace(/G/,"B");
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

FinanceTreemap.prototype.updateVis = function() {
    var vis = this;

    vis.mapSvg.call(vis.tip);

    /* Draw vis using vis.displayData */
    vis.squares = vis.mapSvg.selectAll('g')
        .data(vis.displayData)
        .enter()
        .append('g')
        .attr('transform', function(d) {return 'translate(' + [d.x0, d.y0] + ')'});

    vis.squares.append('rect')
        .attr('class', 'treemap-rect')
        .attr('width', function(d) { return d.x1 - d.x0; })
        .attr('height', function(d) { return d.y1 - d.y0; })
        .attr('fill', function(d) {
            return coinColorScale(d.data.coin);
        })
        .attr('stroke', 'whitesmoke')
        .on('click', function(d) {
            $(vis.eventHandler).trigger("coinChanged", d.data.coin);
        })
        .on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide);

    vis.squares.append('text')
        .attr('dx', 4)
        .attr('dy', 14)
        .attr('class', 'square-label')
        .attr('pointer-events', 'none')
        .text(function(d) {
            if (d.data.coin === 'AllCoins') {
                return ''
            }
            return d.data.coin;
        });

    vis.squares.append('text')
        .attr('dx', 4)
        .attr('dy', 28)
        .attr('class', 'square-label')
        .attr('pointer-events', 'none')
        .text(function(d) {
            // Skip aggregate square label, and don't label small squares (hover instead to show)
            if (d.data.coin === 'AllCoins' || d.data.value < 2000000000) {
                return ''
            }
            return vis.formatBillions(d.data.value);
        });
};