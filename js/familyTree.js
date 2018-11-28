/*
 * ExampleVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data	    		-- the actual data: perDayData
 * @param _eventHandler     -- event handler for this visualization (perhaps not necessary if a vis only reacts to, not triggers, events)
 */
FamilyTree = function(_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.lineChart = _eventHandler;
    this.filteredData = this.data;

    this.initVis();
};

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

FamilyTree.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 10, right: 10, bottom: 10, left: 10 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select("#" + vis.parentElement).append('svg')
        .attr("width", vis.width)
        .attr('class', 'tree-SVG')
        .append('g')
        .attr('class', 'tree-g')
        .attr('font-size', 10)

    // links group
    vis.svg.append('g')
        .attr('class', 'links-g')
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

    vis.svg.append('g')
        .attr('class', 'nodes-g');

    // labels group
    vis.svg.append('g')
        .attr('class', 'labels-g');




    for (var i = 0; i < vis.data.length; i++) {
        setDelay(i);
    }
    function setDelay(i) {
        setTimeout(function() {
            // Scales, axes, and domains
            vis.i = i;
            vis.date = vis.data[i][0];
            vis.root = d3.hierarchy(vis.data[i][1])
                .sort((a, b) => (a.height - b.height) || a.data.coin.localeCompare(b.data.name));

            vis.root.dx = 10;
            vis.root.dy = vis.width / (vis.root.height + 1);

            vis.root = d3.cluster().nodeSize([vis.root.dx, vis.root.dy])(vis.root);

            let x0 = Infinity;
            let x1 = -Infinity;

            vis.root.each(function(d) {
                if (d.x > x1) x1 = d.x;
                if (d.x < x0) x0 = d.x;
            });

            vis.svg = d3.select('.tree-SVG')
                .attr("height", (x1 - x0 + vis.root.dx*2) + vis.margin.top + vis.margin.bottom)
                .select('.tree-g')
                .attr("transform", `translate(${vis.root.dy / 3},${vis.root.dx - x0})`);

            vis.wrangleData();
        }, i*500);
    }
};

/*
 * Data wrangling
 */

FamilyTree.prototype.wrangleData = function() {
    var vis = this;

    // Perform any data manipulation if necessary on the filtered data
    vis.displayData = vis.root;

    // Update the visualization
    vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

FamilyTree.prototype.updateVis = function() {
    var vis = this;

    /* Draw vis using vis.displayData */

    vis.lineChart.updateVerticalLine(vis.date, vis.lineChart, vis.i);

    var treeDate = d3.timeFormat('%B %Y')(vis.date);
    d3.select('#tree-date-label').node().innerHTML = `${treeDate}`;

    // Draw links
    let links = vis.svg.selectAll('.links-g')
        .selectAll(".tree-link")
        .data(vis.displayData.links(), function(d) {
            return d.source.data.coin + '-' + d.target.data.coin;
        });

    links.enter().append("path")
        .attr('class', 'tree-link')
        .merge(links)
        .transition()
        .duration(500)
        .attr("d", d => `
        M${d.target.y},${d.target.x}
        C${d.source.y + vis.displayData.dy / 2},${d.target.x}
         ${d.source.y + vis.displayData.dy / 2},${d.source.x}
         ${d.source.y},${d.source.x}
      `);

    // Draw circles
    let circles = vis.svg.selectAll('.nodes-g')
        .selectAll('.node-circle')
        .data(vis.displayData.descendants().reverse(), function(d) {
            if (d.parent) {
                if (!isNaN(d.data.coin)) {
                    return d.parent.data.coin + '-num';
                }
                return d.parent.data.coin + '-' + d.data.coin
            }
            return d.data.coin;
        });

    let tip = d3.tip().attr('class', 'd3-tip');

    vis.svg.call(tip);

    circles.enter().append('circle')
        .attr('class', 'node-circle')
        .attr('cx', function(d) {
            if (d.parent) {
                return d.parent.y;
            }
            return 0;
        })
        .attr('cy', function(d) {
            if (d.parent) {
                return d.parent.x;
            }
            return 0;
        })
        .merge(circles)
        .transition()
        .duration(500)
        .attr('cx', function(d) { return d.y; })
        .attr('cy', function(d) { return d.x; })
        .attr("fill", function(d) {
            return (d.data.status === "running" || Array.isArray(d.data.status)) ? 'white' : '#ffb3ba'
        })
        .attr("r", function(d) {
            if (!isNaN(d.data.coin)) {
                var num = Number(d.data.coin);
                return num * 0.1 + 2;
            }
            else {
                return 3;
            }
        })
        .attr('stroke', 'black')
        .attr('stroke-width', '.5');

    circles.on('mouseover', function(d) {
            if (vis.i === 37) {
                var tipList = d.data.status.map(function(coin) {
                    return Object.keys(coin)[0]
                });
                var tipText = '';
                tipList.forEach(function(d, i) {
                    tipText += d.toString();
                    if (i !== tipList.length - 1) tipText += ", ";
                });
                tip.html(tipText);
                tip.show();
            }
        })
        .on('mouseout', function(d) {
            if (vis.i === 37) {
                tip.hide();
            }
        });

    // Draw labels
    let labels = vis.svg.selectAll('.labels-g')
        .selectAll('.node-text')
        .data(vis.displayData.descendants().reverse(), function(d) {
            if (d.parent) {
                if (!isNaN(d.data.coin)) {
                    return d.parent.data.coin + '-num';
                }
                return d.parent.data.coin + '-' + d.data.coin
            }
            return d.data.coin;
        });

    labels.enter().append("text")
        .attr('class', 'node-text')
        .merge(labels)
        .attr("transform", function(d) {
            if (d.parent) {
                return `translate(${d.parent.y},${d.parent.x})`
            }
            return 'translate(0,0)';
        })
        .transition()
        .duration(500)
        .attr("dy", "0.31em")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("x", d => d.children ? -6 : (!isNaN(d.data.coin) ? 15 : 6))
        .text(d => d.data.coin)
        .filter(d => d.children)
        .attr("text-anchor", "end")
        .attr('opacity', 1);

    // Exit
    links.exit().remove();
    circles.exit().remove();
    labels.exit().remove();
};

/*
 * Filtering function - only necessary if this visualization is filtered based on some mechanic
 * E.g. brush, inputs, event trigger from another visualization in the dashboard (apply parameters as necessary)
 */

FamilyTree.prototype.onUpdateData = function() {
    var vis = this;

    // Update vis.filteredData

    vis.wrangleData();
};
