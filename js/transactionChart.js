/*
 * TransactionChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data	    		-- the actual data: perDayData
 * @param _eventHandler     -- event handler for this visualization (perhaps not necessary if a vis only reacts to, not triggers, events)
 */
TransactionChart = function(_parentElement, _data,) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.filteredData = this.data;

    this.initVis();
};

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

TransactionChart.prototype.initVis = function() {
    var vis = this;

    vis.showTraditional = true;

    vis.margin = { top: 10, right: 40, bottom: 40, left: 40 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales, axes, and domains
    vis.x = d3.scaleLinear()
        .domain(d3.extent(vis.data, function(d) { return d.txs; }))
        .range([0, vis.width]);

    // Scale for the radius
    vis.r = d3.scaleLinear()
        .domain(d3.extent(vis.data, function(d) { return d.txs; }))
        .range([20, 120]);

    // Force stuff
    vis.force = d3.forceSimulation(vis.data)
        .force('charge', d3.forceManyBody().strength(5))
        .force("center", d3.forceCenter().x(vis.width / 2).y(vis.height / 2))
        .force('collide', d3.forceCollide().radius(function(d) {
            return vis.r(d.txs) + 5;
        }))
        .force('radial', d3.forceRadial().radius(80).x(vis.width / 2).y(vis.height / 2));

    // Legend
    vis.legend = vis.svg.append('g')
        .attr('class', 'bubble-legend');

    vis.legend.selectAll('rect')
        .data(vis.data)
        .enter()
        .append('rect')
        .attr('class', function(d) {
            var classes = 'bubble-legend-rect';
            if (d.coin === 'Visa' || d.coin === 'PayPal') {
                classes += ' traditional';
            }
            return classes;
        })
        .attr('x', 0)
        .attr('y', function(d, i) { return i * 30; })
        .attr('width', 20)
        .attr('height', 20)
        .attr('fill', function(d) {
            if (vis.showTraditional && (d.coin === 'Visa' || d.coin === 'PayPal')) {
                var color = coinColorScale(d.coinLabel);
                return hexToRgba(color, 0.5);
            }
            return coinColorScale(d.coinLabel);
        })
        .attr('stroke', function(d) {
            if (vis.showTraditional && (d.coin === 'Visa' || d.coin === 'PayPal')) {
                return coinColorScale(d.coinLabel);
            }
            return 'none';
        })
        .attr('stroke-width', function(d) {
            if (vis.showTraditional && (d.coin === 'Visa' || d.coin === 'PayPal')) {
                return '2px';
            }
            return 0;
        });

    vis.legend.selectAll('text')
        .data(vis.data)
        .enter()
        .append('text')
        .attr('class', 'bubble-legend-label')
        .attr('x', 30)
        .attr('y', function(d, i) { return i * 30 + 16; })
        .text(function(d) { return d.coin; });

    // Data caption
    vis.svg.append("text")
        .attr("class", "kennyText")
        .attr("x", vis.width)
        .attr("y", vis.height - 12)
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .text("Transaction speed data as of 2018");

    // tooltips
    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(function(d) {
            return "<div>" +
                        "<p>" + d.coin + "</p>" +
                        "<p>" + d.txs + "TPS" + "</p>" +
                    "</div>";
        });

    // (Filter, aggregate, modify data)
    vis.wrangleData();
};

/*
 * Data wrangling
 */

TransactionChart.prototype.wrangleData = function() {
    var vis = this;

    // Perform any data manipulation if necessary on the filtered data
    vis.displayData = vis.filteredData;

    vis.force.nodes(vis.displayData);
    vis.force.alpha(1).restart();

    // Update the visualization
    vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

TransactionChart.prototype.updateVis = function() {
    var vis = this;

    vis.svg.call(vis.tip);

    /* Draw vis using vis.displayData */

    // Draw nodes
    vis.nodesSvg = vis.svg.selectAll(".bubble")
        .data(vis.displayData, function(d) { return d.coin; });

    vis.nodes = vis.nodesSvg.enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("r", function(d) {
            return vis.r(d.txs);
        })
        .attr("fill", function(d) {
            var color = coinColorScale(d.coinLabel);
            return hexToRgba(color, 0.9);
        })
        .attr('stroke', function(d) {
            return coinColorScale(d.coinLabel);
        })
        .merge(vis.nodesSvg);

    vis.nodes.on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide);

    // Draw node labels
    vis.labelsSvg = vis.svg.selectAll(".bubble-text")
        .data(vis.displayData, function(d) { return d.coin; });

    vis.labels = vis.labelsSvg.enter()
        .append('text')
        .attr('class', 'bubble-text')
        .text(function(d) {
            return d.title;
        })
        .merge(vis.labelsSvg);

    vis.nodesSvg.exit().transition().attr('r', 0).remove();
    vis.labelsSvg.exit().transition().attr('font-size', 0).remove();

    // force simulation
    vis.force.on("tick", function() {
        // Update node coordinates
        vis.nodes.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        // Update text coordinates
        vis.labels.attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y + 5; });
    });

    // update legend for traditional processors
    vis.legend.selectAll('.traditional')
        .attr('fill', function(d) {
            if (!vis.showTraditional && (d.coin === 'Visa' || d.coin === 'PayPal')) {
                var color = coinColorScale(d.coinLabel);
                return hexToRgba(color, 0.5);
            }
            return coinColorScale(d.coinLabel);
        })
        .attr('stroke', function(d) {
            if (!vis.showTraditional && (d.coin === 'Visa' || d.coin === 'PayPal')) {
                return coinColorScale(d.coinLabel);
            }
            return 'none';
        })
        .attr('stroke-width', function(d) {
            if (!vis.showTraditional && (d.coin === 'Visa' || d.coin === 'PayPal')) {
                return '2px';
            }
            return 0;
        });
};

/*
 * Filtering function - only necessary if this visualization is filtered based on some mechanic
 * E.g. brush, inputs, event trigger from another visualization in the dashboard (apply parameters as necessary)
 */

TransactionChart.prototype.onUpdateData = function(showTraditional) {
    var vis = this;

    vis.showTraditional = showTraditional;
    // Update vis.filteredData
    if (vis.showTraditional) {
        vis.filteredData = vis.data;
    } else {
        vis.filteredData = vis.data.filter(function(d) { return d.coin !== 'Visa' && d.coin !== 'PayPal'; });
    }

    vis.wrangleData();
};
