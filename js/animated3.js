/*
 * ExampleVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the vizualization
 * @param _data	    		-- the actual data: perDayData
 * @param _eventHandler     -- event handler for this vizualization (perhaps not necessary if a viz only reacts to, not triggers, events)
 */
animatedGlobe = function(_parentElement, _data1, _data2, _geoFile) {
    this.parentElement = _parentElement;
    this.attitudeD = _data1;
    this.legalityD = _data2;
    this.geoFile = _geoFile;

    this.initVis();
};

/*
 * Initialize vizualization (static content, e.g. SVG area or axes)
 */

var viz;
animatedGlobe.prototype.initVis = function() {
    viz = this;

    viz.margin = { top: 40, right: 40, bottom: 40, left: 40 };

    viz.width = $("#" + viz.parentElement).width() - viz.margin.left - viz.margin.right,
        viz.height = 900 - viz.margin.top - viz.margin.bottom;

    // SVG drawing area
    viz.svg = d3.select("#" + viz.parentElement).append("svg")
        .attr("width", viz.width + viz.margin.left + viz.margin.right)
        .attr("height", viz.height + viz.margin.top + viz.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + viz.margin.left + "," + viz.margin.top + ")")
        .on("mousedown", mousedown);

    // Scales, axes, and domains

    // (Filter, aggregate, modify data)
    viz.wrangleData();
};

/*
 * Data wrangling
 */

animatedGlobe.prototype.wrangleData = function() {
//    var viz = this;

    // Perform any data manipulation if necessary on the filtered data
   // viz.displayData = viz.filteredData;

    // Update the vizualization
    viz.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

animatedGlobe.prototype.updateVis = function() {
//    var viz = this;

    var features // all svg paths (countries) of the world
        // geojson for "all features we have loaded so far":
        , toggle // animation on/off control
    ;

    viz.projection = d3.geoOrthographic()
        .scale(380)
        .rotate([-71.03,42.37])
        .translate([400, 400]);

    viz.circle = d3.geoCircle()
        .center(viz.projection.rotate());

    var scale =
        { orthographic: 380
            , stereographic: 380
            , gnomonic: 380
            , equidistant: 380 / Math.PI * 2
            , equalarea: 380 / Math.SQRT2
        };

    viz.path = d3.geoPath()
        .projection(viz.projection);



    if (frameElement) frameElement.style.height = '800px';

    d3.json("data/countries.geo.json", function(collection) {
        feature = viz.svg.selectAll("path")
            .data(collection.features)
            .enter().append("svg:path")
            .attr("d", clip);

        feature.append("svg:title")
            .text(function(d) { return d.properties.name; });

        startAnimation();
        d3.select('#animate').on('click', function () {
            if (done) startAnimation(); else stopAnimation();
        });
    });


    /* Draw viz using viz.displayData */

    // Enter, update, exit

    // Draw axes (if applicable)

    // Draw legend (if applicable)


};

/*
 * Filtering function - only necessary if this vizualization is filtered based on some mechanic
 * E.g. brush, inputs, event trigger from another vizualization in the dashboard (apply parameters as necessary)
 */

animatedGlobe.prototype.onUpdateData = function() {
    var viz = this;

    // Update viz.filteredData

    viz.wrangleData();
};

function stopAnimation() {
    done = true;
    d3.select('#animate').node().checked = false;
}

function startAnimation() {
    done = false;
    d3.timer(function() {
        var origin = viz.projection.center();
        origin = [origin[0] + .18, origin[1] + .06];
        viz.projection.center(origin);
        viz.circle.center(origin);
        refresh();
        return done;
    });
}

function animationState() {
    return 'animation: '+ (done ? 'off' : 'on');
}

d3.select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);

d3.select("select").on("change", function() {
    stopAnimation();
    viz.projection.mode(this.value).scale(scale[this.value]);
    refresh(750);
});

var m0
    , o0
    , done
;

function mousedown() {
    stopAnimation();
    m0 = [d3.event.pageX, d3.event.pageY];
    o0 = viz.projection.origin();
    d3.event.preventDefault();
}

function mousemove() {
    if (m0) {
        var m1 = [d3.event.pageX, d3.event.pageY]
            , o1 = [o0[0] + (m0[0] - m1[0]) / 8, o0[1] + (m1[1] - m0[1]) / 8];
        viz.projection.origin(o1);
        circle.origin(o1);
        refresh();
    }
}

function mouseup() {
    if (m0) {
        mousemove();
        m0 = null;
    }
}

function refresh(duration) {
    (duration ? feature.transition().duration(duration) : feature).attr("d", clip);
}

function clip(d) {
    return viz.path(viz.circle);
}

function reframe(css) {
    for (var name in css)
        frameElement.style[name] = css[name] + 'px';
}



