

/*
 * BarChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'household characteristics'
 * @param _config					-- variable from the dataset (e.g. 'electricity') and title for each bar chart
 */
 var formatD = d3.format(".0f");

BarChart = function(_parentElement, _data){
	this.parentElement = _parentElement;
	this.data = _data;
	// this.config = _config;
	this.displayData = _data;
	this.sdata = _data;
	this.initVis();
}



/*
 * Initialize visualization (static content; e.g. SVG area, axes)
 */

BarChart.prototype.initVis = function(){
	var vis = this;


	// * TO-DO *
	vis.margin = {top: 20, right: 70, bottom: 30, left: 50};

	vis.width = $("#crimeChart").width() - vis.margin.left - vis.margin.right - 60,
    vis.height = 300 - vis.margin.top - vis.margin.bottom;


    // SVG drawing area
	vis.svg = d3.select("#" + vis.parentElement).append("svg")
	    .attr("width", vis.width + vis.margin.left + vis.margin.right)
	    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

	//scales and axis
	// Scales
	vis.y = d3.scaleBand()
	    .rangeRound([vis.height, 0])
		.paddingInner(0.1);

	vis.x = d3.scaleLinear()
	    .range([0, vis.width]);

	// axes
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

	//title
	vis.svg.append("text")
		.text("Loss to Criminal Activity ($M)")
    .attr("class", "kennyText")
		.attr("dx", vis.width/2)
		.attr("text-anchor", "middle")
		.attr("dy", -5);
	// (Filter, aggregate, modify data)s
	vis.wrangleData();
}



/*
 * Data wrangling
 */

BarChart.prototype.wrangleData = function(){
	var vis = this;

  for(var i in vis.data){
    vis.data[i].loss = vis.data[i].loss/1000000;
  }
  vis.data.sort(function(a, b){
    return b.loss - a.loss;
  })
	// Update the visualization
	vis.updateVis();
}



/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

BarChart.prototype.updateVis = function(){
	var vis = this;

	// (1) Update domains
	// (2) Draw rectangles
	// (3) Draw labels

	// * TO-DO *
	// Update domain
	// Get the maximum of the multi-dimensional array or in other words, get the highest peak of the uppermost layer
	vis.x.domain([0, d3.max(vis.data, function(d) {
			return d.loss;
		})
	]);

	vis.y.domain(vis.data.map(function(d){return d.crime;}));

	//draw rectangles
	vis.svg.selectAll(".bar")
		.data(vis.data)
		.enter().append("rect")
		.attr("class", "bar")
		.attr("y", function(d) {return vis.y(d.crime);})
		.attr("height", vis.y.bandwidth())
		.merge(vis.svg.selectAll(".bar").data(vis.data))
		.transition()
		.duration(800)
		.attr("x", 0)
		.attr("width", function(d) {return vis.x(d.loss);});

	vis.svg.selectAll(".text")
		.data(vis.data)
		.enter().append("text")
		.attr("class", "kennyText")
		.attr("dy", function(d) {return vis.y(d.crime) + (vis.y.bandwidth()/2);})
		.attr("text-anchor", "right")
		.merge(vis.svg.selectAll(".text").data(vis.data))
		.attr("dx", function(d) {return vis.x(d.loss) + 5;})
		.text(function(d) {return formatD(d.loss)});




	// Update the axis
	vis.svg.select(".x-axis").transition().duration(800).call(vis.xAxis);
	vis.svg.select(".y-axis").call(vis.yAxis);
}



/*
 * Filter data when the user changes the selection
 * Example for brushRegion: 07/16/2016 to 07/28/2016
 */

// BarChart.prototype.selectionChanged = function(brushRegion){
// 	var vis = this;
//
// 	// Filter data accordingly without changing the original data
// 	// * TO-DO *
// 	vis.sdata = vis.data.filter(d => {
// 		return parseDate(d.survey).getTime() >= brushRegion[0].getTime() &&
// 					 parseDate(d.survey).getTime() <= brushRegion[1].getTime();
// 	});
//
// 	// Update the visualization
// 	vis.wrangleData();
// }
