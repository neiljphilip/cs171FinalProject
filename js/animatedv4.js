/*
 * ExampleVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data	    		-- the actual data: perDayData
 * @param _eventHandler     -- event handler for this visualization (perhaps not necessary if a vis only reacts to, not triggers, events)
 */
dragGlobe = function(_parentElement, _data1, _data2, _data3, _data4, _data5) {
    this.parentElement = _parentElement;
    this.world = _data1;
    this.countryName = _data2;
    this.attitude = _data3;
    this.legality = _data4;
    this.volume = _data5;

    this.initVis();
};

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

dragGlobe.prototype.initVis = function() {
    var vis = this;


    vis.margin = { top: 40, right: 40, bottom: 40, left: 40 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

    vis.sens = 0.25;
    vis.focused;

    vis.projection = d3.geoOrthographic()
        .scale(200)
        .rotate([0, 0])
        .translate([vis.width / 2.8, vis.height / 2])
        .clipAngle(90);

    vis.path = d3.geoPath()
        .projection(vis.projection);

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("class", "changeClass")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


    // adds the water
    vis.svg.append("path")
        .datum({type: "Sphere"})
        .attr("class", "water")
        .attr("d", vis.path)
        .call(d3.drag()
            .subject(function() { var r = vis.projection.rotate(); return {x: r[0] / vis.sens, y: -r[1] / vis.sens}; })
            .on("drag", function() {
                vis.timer.stop();
                vis.rotate = vis.projection.rotate();
                vis.projection.rotate([d3.event.x * vis.sens, -d3.event.y * vis.sens, vis.rotate[2]]);
                vis.svg.selectAll("path.land").attr("d", vis.path);
                vis.svg.selectAll(".focused").classed("focused", vis.focused = false);
                //   spinning_globe();
            }));

    // adds tooltip
    vis.countryTooltip = d3.select("body").append("div").attr("class", "countryTooltip");

    vis.countryById = {},
        vis.countries = topojson.feature(vis.world, vis.world.objects.countries).features;

    //Adding countries to select

    vis.countryName.forEach(function(d) {
        vis.countryById[d.id] = d.name;
    });

    //Drawing countries on the globe

    vis.globe = vis.svg.selectAll("path.land")
        .data(vis.countries)
        .enter().append("path")
        .attr("class", "land")
        .attr("d", vis.path)
        .style("fill", function(d) {
           var selectVal =  d3.select("#choropleth-option").node().value;
            var countryN = vis.countryById[d.id];
            if (selectVal == "legality") {
                var legality = getLegality(countryN);
                if (legality == "Legal") return "green";
                else if (legality == "Illegal") return "red";
                else return "d3d3d3";
            } else {
                var attitude = getAtt(countryN);

                if (attitude == "permissive") {
                    return "#169B92";
                } else if (attitude == "contentious") {
                   return "#ffd700";
                } else if (attitude == "hostile") {
                    return "#ff6200";
                } else if (attitude == "none") {
                    return "#d3d3d3";
                }

            }

        })

    //Drag event

    .call(d3.drag()
        .subject(function() { var r = vis.projection.rotate(); return {x: r[0] / vis.sens, y: -r[1] / vis.sens}; })
        .on("drag", function() {
            vis.timer.stop();
            vis.rotate = vis.projection.rotate();
            vis.projection.rotate([d3.event.x * vis.sens, -d3.event.y * vis.sens, vis.rotate[2]]);
            vis.svg.selectAll("path.land").attr("d", vis.path);
            vis.svg.selectAll(".focused").classed("focused", vis.focused = false);
         //   spinning_globe();
        }))

        .on("mouseover", function(d) {
            var countryN = vis.countryById[d.id];
            vis.countryTooltip.text(countryN)
                .style("left", (d3.event.pageX + 7) + "px")
                .style("top", (d3.event.pageY - 15) + "px")
                .style("display", "block")
                .style("opacity", 1);


            var css = '.land:hover { fill: yellow !important; }';
            // may break if country not in data!
            var style = document.createElement('style');

            if (style.styleSheet) {
                style.styleSheet.cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            document.getElementsByTagName('head')[0].appendChild(style);

        })
        .on("mouseout", function(d) {
            vis.countryTooltip.style("opacity", 0)
                .style("display", "none");
        })
        .on("mousemove", function(d) {
            vis.countryTooltip.style("left", (d3.event.pageX + 7) + "px")
                .style("top", (d3.event.pageY - 15) + "px");
        })
        .on("click", textUpdate);

    // legend

    vis.svg
        .append("rect")
        .attr("class", "legendBox")
        .attr("x", vis.width - 80)
        .attr("y", vis.height - 100)
        .attr("height", 20)
        .attr("width", 20)
        .style("fill", "green")
        .style("stroke", "black")
        .style("stroke-width", 2);


    vis.svg
        .append("rect")
        .attr("class", "legendBox")
        .attr("x", vis.width - 80)
        .attr("y", vis.height - 70)
        .attr("height", 20)
        .attr("width", 20)
        .style("fill", "red")
        .style("stroke", "black")
        .style("stroke-width", 2);

    vis.svg
        .append("rect")
        .attr("class", "legendBox")
        .attr("x", vis.width - 80)
        .attr("y", vis.height - 40)
        .attr("height", 20)
        .attr("width", 20)
        .style("fill", "#d3d3d3")
        .style("stroke", "black")
        .style("stroke-width", 2);

    vis.svg.append("text")
        .attr("class", "legLabel")
        .attr("x", vis.width - 80)
        .attr("y", vis.height - 110)
        .text(function(d) {
            return "Bitcoin Legality";
        })
        .style("fill", "whitesmoke");
    // text labels
    vis.svg.append("text")
        .attr("class", "legLabel")
        .attr("x", vis.width - 50)
        .attr("y", vis.height - 85)
        .text(function(d) {
            return "Legal";
        })
        .style("fill", "whitesmoke");

    vis.svg.append("text")
        .attr("class", "legLabel")
        .attr("x", vis.width - 50)
        .attr("y", vis.height - 55)
        .text(function(d) {
            return "Illegal";
        })
        .style("fill", "whitesmoke");

    vis.svg.append("text")
        .attr("class", "legLabel")
        .attr("x", vis.width - 50)
        .attr("y", vis.height - 25)
        .text(function(d) {
            return "No Data";
        })
        .style("fill", "whitesmoke");

    // Static (grounding) text
    updateText("countryName", "Country: ");
    updateText("legality", "Bitcoin Legal Status: ");
    updateText("att", "Public Opinion: ");






    // modified from http://bl.ocks.org/cyrilcherian/8f573be5c2dbc6620fedad8f7b1e247d/3fbb024bcfff8c2d0fe49f78deda74c29d42d1d3

    function spinning_globe(){

        var time = Date.now();
        var rotate = [0, -10];
        var velocity = [.015, -0];


       vis.timer = d3.timer(t => {

            // get current time
            var dt = Date.now() - time;
            //Define new projection over a rotating path
            vis.projection.rotate([rotate[0] + velocity[0] * dt, rotate[1] + velocity[1] * dt]);

            //Add new projection to the map
            vis.svg.selectAll("path").attr('d', vis.path)


        }); // end timer spinning globe

    }; // end spinning globe

    spinning_globe();


    // helper functions
    function getAtt(countryN) {
        var att = vis.attitude[vis.attitude.findIndex(item => item.Nation === countryN)];
        if (att === undefined) {
            return "none";
        } else {
            return att.Status;
        }

    }


    function getLegality(countryN) {
        var att = vis.legality[vis.legality.findIndex(item => item.Country === countryN)];
        if (att === undefined) {
            return "none";
        } else {
            return att.Legal;
        }

    }

    function getCountry(countryN) {
        return vis.volume[vis.volume.findIndex(item => item.Country === countryN)];
    }

    function textUpdate(d) {
        $("#pie").empty();
        $("#att").empty();
        $("#legality").empty();
        $("#worldShare").empty();
        var countryN = vis.countryById[d.id];
       updateText("countryName", "Country: " + countryN);
       var legalValue = getLegality(countryN);
       if (legalValue == "none") {
           updateText("legality", "Bitcoin Legal Status: No data available");
           d3.select("#legality").style("color", "#d3d3d3");
       } else {
           updateText("legality", "Bitcoin Legal Status: " + legalValue);
           if (legalValue == "Legal")  d3.select("#legality").style("color", "green");
           else  d3.select("#legality").style("color", "red");
       }


    var attitudeVal = getAtt(countryN);
       var attStatement = "";

       if (attitudeVal == "permissive") {
              attStatement += "Permissive";
           updateText("att", "Public Opinion: " + attStatement);
           d3.select("#att").style("color", "#169B92");
           } else if (attitudeVal == "contentious") {
              attStatement += "Contentious";
           updateText("att", "Public Opinion: " + attStatement);
           d3.select("#att").style("color", "#ffd700");
           } else if (attitudeVal == "hostile") {
           attStatement += "Hostile";
           updateText("att", "Public Opinion: " + attStatement);
           d3.select("#att").style("color", "#ff6200");
       } else {
           updateText("att", "Public Opinion: No data available");
           d3.select("#att").style("color", "#d3d3d3");
       }






        // SVG drawing area
        var width = 200,
            height = 200;

// Position the pie chart (currently only a placeholder) in the middle of the SVG area
        var svgP = d3.select("#pie").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

// Initialize the data
        console.log(vis.volume);
        var cryptoCurr = getCountry(countryN);
        var cryptoPercent;
        if (cryptoCurr !== undefined) {
            cryptoPercent = cryptoCurr.Raw;
            $("#worldShare").html("Share of World Bitcoin Transaction Volume");
        }
        var data = [cryptoPercent, 1 - cryptoPercent];

// Define a default pie layout
        var pie = d3.pie();

// Ordinal color scale (10 default colors)
        var color = d3.scaleOrdinal(d3.schemeCategory10);

// Pie chart settings
        var outerRadius = width / 2;
        var innerRadius = 0;      // Relevant for donut charts

// Path generator for the pie segments
        var arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

// Append a group for each pie segment
        var g = svgP.selectAll(".arc")
            .data(pie(data))
            .enter()
            .append("g")
            .attr("class", "arc");

// Use the path generator to draw the arcs
        g.append("path")
            .merge(g)
            .attr("d", arc)
            .style("fill", function(d, index) { return color(index); });

        g.append("text")
            .attr("transform", function(d) {
                return "translate(" + arc.centroid(d) + ")"; })
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .text(function(d) {
                if (d.value > 0.06) {
                    if (d.value > 0.5) {
                        var format = d3.format(".1%")(d.value);
                        if (format == "100.0%") {
                            $("#pie").empty();
                            $("#worldShare").empty();
                        }
                        else return "World: " + format;
                    }

                    else
                        return d3.format(".1%")(d.value);
                }
                });

        g.exit().remove();
    }

    function addElement(parentId, elementTag, elementId, html) {
        var p = document.getElementById(parentId);
        var newElement = document.createElement(elementTag);
        newElement.setAttribute('id', elementId);
        newElement.innerHTML = html;
        p.appendChild(newElement);
    }

    // update link
    function updateLink(elementId, html) {
        var p = document.getElementById(elementId);
        p.innerHTML = html;
        p.setAttribute("href", html);
        p.setAttribute("target", "_blank");
    }

    function updatePic(elementId, html) {
        var p = document.getElementById(elementId);
        p.setAttribute("src", html);
        p.setAttribute("height", "320");
        p.setAttribute("width", "443")
    }

    function updateText(elementId, html) {
        var p = document.getElementById(elementId);
        p.innerHTML = html;
    }

//    vis.wrangleData();
};

/*
 * Data wrangling
 */

dragGlobe.prototype.wrangleData = function() {
    var vis = this;

    // Perform any data manipulation if necessary on the filtered data


    // Update the visualization
  //  vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 * Function parameters only needed if different kinds of updates are needed
 */

dragGlobe.prototype.updateVis = function() {
    var vis = this;



    /* Draw vis using vis.displayData */

    // Enter, update, exit

    // Draw axes (if applicable)

    // Draw legend (if applicable)
};

/*
 * Filtering function - only necessary if this visualization is filtered based on some mechanic
 * E.g. brush, inputs, event trigger from another visualization in the dashboard (apply parameters as necessary)
 */

dragGlobe.prototype.onUpdateData = function(option) {
    var vis = this;
    var selectVal =  d3.select("#choropleth-option").node().value;

    // repaint the choropleth
    vis.svg.selectAll("path.land")
        .style("fill", function(d) {

            var countryN = vis.countryById[d.id];
            if (selectVal == "legality") {
                var legality = getLegality(countryN);
                if (legality == "Legal") return "green";
                else if (legality == "Illegal") return "red";
                else return "d3d3d3";
            } else {
                var attitude = getAtt(countryN);

                if (attitude == "permissive") {
                    return "#169B92";
                } else if (attitude == "contentious") {
                    return "#ffd700";
                } else if (attitude == "hostile") {
                    return "#ff6200";
                } else if (attitude == "none") {
                    return "#d3d3d3";
                }

            }
        });

    // handle legend changes

    d3.selectAll(".legendBox").remove();
    $(".legLabel").empty();
    if (selectVal == "legality") {

        vis.svg
            .append("rect")
            .attr("class", "legendBox")
            .attr("x", vis.width - 80)
            .attr("y", vis.height - 100)
            .attr("height", 20)
            .attr("width", 20)
            .style("fill", "green")
            .style("stroke", "black")
            .style("stroke-width", 2);


        vis.svg
            .append("rect")
            .attr("class", "legendBox")
            .attr("x", vis.width - 80)
            .attr("y", vis.height - 70)
            .attr("height", 20)
            .attr("width", 20)
            .style("fill", "red")
            .style("stroke", "black")
            .style("stroke-width", 2);

        vis.svg
            .append("rect")
            .attr("class", "legendBox")
            .attr("x", vis.width - 80)
            .attr("y", vis.height - 40)
            .attr("height", 20)
            .attr("width", 20)
            .style("fill", "#d3d3d3")
            .style("stroke", "black")
            .style("stroke-width", 2);

        vis.svg.append("text")
            .attr("class", "legLabel")
            .attr("x", vis.width - 80)
            .attr("y", vis.height - 110)
            .text(function(d) {
                return "Bitcoin Legality";
            })
            .style("fill", "whitesmoke");
        // text labels
        vis.svg.append("text")
            .attr("class", "legLabel")
            .attr("x", vis.width - 50)
            .attr("y", vis.height - 85)
            .text(function(d) {
                return "Legal";
            })
            .style("fill", "whitesmoke");

        vis.svg.append("text")
            .attr("class", "legLabel")
            .attr("x", vis.width - 50)
            .attr("y", vis.height - 55)
            .text(function(d) {
                return "Illegal";
            })
            .style("fill", "whitesmoke");

        vis.svg.append("text")
            .attr("class", "legLabel")
            .attr("x", vis.width - 50)
            .attr("y", vis.height - 25)
            .text(function(d) {
                return "No Data";
            })
            .style("fill", "whitesmoke");

    } else {
        vis.svg
            .append("rect")
            .attr("class", "legendBox")
            .attr("x", vis.width - 80)
            .attr("y", vis.height - 120)
            .attr("height", 20)
            .attr("width", 20)
            .style("fill", "#169B92")
            .style("stroke", "black")
            .style("stroke-width", 2);


        vis.svg
            .append("rect")
            .attr("class", "legendBox")
            .attr("x", vis.width - 80)
            .attr("y", vis.height - 90)
            .attr("height", 20)
            .attr("width", 20)
            .style("fill", "#ffd700")
            .style("stroke", "black")
            .style("stroke-width", 2);

        vis.svg
            .append("rect")
            .attr("class", "legendBox")
            .attr("x", vis.width - 80)
            .attr("y", vis.height - 60)
            .attr("height", 20)
            .attr("width", 20)
            .style("fill", "#ff6200")
            .style("stroke", "black")
            .style("stroke-width", 2);

        vis.svg
            .append("rect")
            .attr("class", "legendBox")
            .attr("x", vis.width - 80)
            .attr("y", vis.height - 30)
            .attr("height", 20)
            .attr("width", 20)
            .style("fill", "#d3d3d3")
            .style("stroke", "black")
            .style("stroke-width", 2);

        vis.svg.append("text")
            .attr("class", "legLabel")
            .attr("x", vis.width - 80)
            .attr("y", vis.height - 130)
            .text(function(d) {
                return "Public Opinion";
            })
            .style("fill", "whitesmoke");

        // text labels
        vis.svg.append("text")
            .attr("class", "legLabel")
            .attr("x", vis.width - 50)
            .attr("y", vis.height - 105)
            .text(function(d) {
                return "Permissive";
            })
            .style("fill", "whitesmoke");

        vis.svg.append("text")
            .attr("class", "legLabel")
            .attr("x", vis.width - 50)
            .attr("y", vis.height - 75)
            .text(function(d) {
                return "Contentious";
            })
            .style("fill", "whitesmoke");

        vis.svg.append("text")
            .attr("class", "legLabel")
            .attr("x", vis.width - 50)
            .attr("y", vis.height - 45)
            .text(function(d) {
                return "Hostile";
            })
            .style("fill", "whitesmoke");

        vis.svg.append("text")
            .attr("class", "legLabel")
            .attr("x", vis.width - 50)
            .attr("y", vis.height - 15)
            .text(function(d) {
                return "No Data";
            })
            .style("fill", "whitesmoke");
    }

 //  var selector = d3.select(".changeClass");
 //  console.log(selector);
  // selector.selectAll("land").attr("fill", "red");


    // Update vis.filteredData

  //  vis.wrangleData();

    function getAtt(countryN) {
        var att = vis.attitude[vis.attitude.findIndex(item => item.Nation === countryN)];
        if (att === undefined) {
            return "none";
        } else {
            return att.Status;
        }

    }


    function getLegality(countryN) {
        var att = vis.legality[vis.legality.findIndex(item => item.Country === countryN)];
        if (att === undefined) {
            return "none";
        } else {
            return att.Legal;
        }

    }

    function getCountry(countryN) {
        return vis.volume[vis.volume.findIndex(item => item.Country === countryN)];
    }

};





