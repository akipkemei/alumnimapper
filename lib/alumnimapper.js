/**
 * ITC Alumni Mapper
 *
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License.
 * see http://creativecommons.org/licenses/by-nc-sa/3.0/
 * @author Barend Kobben <kobben@itc.nl>
 * @version 0.1 [July 2013]
 */

// global constants:
const VERSION = "0.1";
const debugOn = true; //activates debugging message window
const errorMsg = 0, showMsg = 1, hideMsg = 2, debugMsg = 3;

// global vars:
var width = 960,
  height = 500;
var messageDiv;
var theMap;
var csvData;
var choropleth_colours

/**
 * INITIALISATION FUNCTION
 */
function init() {

  messageDiv = document.getElementById("messageDiv");
  //create & hide message box. Messages are debugged into console
  setMessage("Loading...",hideMsg);

  //use Robinson proj from d3.geo.projection plugin:
  var projection = d3.geo.robinson()
    .scale(150)
    .translate([width / 2, height / 2])
    .precision(.1);

  var geoPath = d3.geo.path()
    .projection(projection);

  var graticule = d3.geo.graticule();

  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

  //draw sphere (= object in projection)
  svg.append("path")
    .datum({type: "Sphere"})
    .attr("id", "sphere")
    .attr("class", "sphere")
    .attr("d", geoPath);

  //draw graticule (= object in projection)
  svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", geoPath);

  // Colour assignment function:
  // choropleth_colours(n) = colour of class i for attrib value n
  choropleth_colours = d3.scale.threshold()
      //5 class boundaries for 6 classes: lowest is for -99 = noData:
      .domain([0, 100000, 280000, 450000, 750000])
      //assign grey for noData, colorbrewer Yellow-Green range for 5 classes:
      .range(["#cccccc", colorbrewer.YlGn[5][0], colorbrewer.YlGn[5][1], colorbrewer.YlGn[5][2],
        colorbrewer.YlGn[5][3], colorbrewer.YlGn[5][4] ])
    ;

  //load attribute data (csv for now)
  d3.csv("data/students.csv", function(error,csv) {
    csvData = csv;
  });

  // async load of topojson world data:
  //
  d3.json("data/worldtopo.json", function(error, world) {
    var countries = topojson.feature(world, world.objects.countries);

    // create country polygons:
    svg.append("g")
      .attr("class", "land")
      .selectAll("path")
      .data(countries.features)
      .enter().append("path")
      .attr("id", joinCSV ) //get id & join other attribs from csv
      .attr("d", geoPath)
      //polygon colour = colour for class of attrib value:
      .style("fill", function(d) { return choropleth_colours(d.properties.pop_dens ); })
      .append("title")  //create title for mouseTips
      .text(function(d) { return d.properties.name + ": " + d.properties.pop_dens + " persons/km2"; })
    ;

    svg.append("path")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", geoPath);

    // create proportional circles on top:
    svg.append("g")
      .attr("class","circles")
      .selectAll("circle")  // select circle nodes
      .data(countries.features)    // bind and join these to the features array in json
      .enter().append("circle")  // for each create a new circle
      .attr("id", joinCSV ) //get id & join other attribs from csv
      .attr("cx", function (d) { // transform the supplied json geo path centroid X to svg "cx":
        return x = Math.round(geoPath.centroid(d)[0]);
      })
      .attr("cy", function (d) { // transform the supplied json geo path centroid Y to svg "cy":
        return y = Math.round(geoPath.centroid(d)[1]);
      })
      .attr("r", function(d) {
        if (d.properties.stud_1950_2006 >= 0) { //circle radius = attrib/25
          setMessage("data: "+d.id+"="+d.properties.stud_1950_2006,debugMsg);
          return d.properties.stud_1950_2006/25
        } else { // undefined or -99 = noData
          setMessage("noData: "+d.properties.stud_1950_2006,debugMsg);
          return 0;
        }
      })
      .append("title") //create title for mouseTips
      .text(function(d) { return d.properties.name + ": " + d.properties.stud_1950_2006 + " students"; })
    ;

  });

  // position svg at upper-left
  d3.select(self.frameElement).style("height", height + "px");

  setMessage("Loaded.",debugMsg);
}

/**
 * joinCSV(d): joins attributes in csvData with topojson
 * per row, using iso_a2 as key
 *
 * @param d -- data row
 * @returns id -- of data row
 */
function joinCSV(d) {
  d.id = d.properties.iso_a2;
  csvData.forEach(function(csv){
    if (d.id == csv.iso_2) {
      // for now, identify the attribs "by hand":
      d.properties.stud_1950_2006 = csv.stud_1950_2006;
      d.properties.stud_2007 = csv.stud_2007;
    }
  });
  return d.id;
}

/**
 * messaging system used for messages as well as errors and debug info
 *
 * @param messageStr : message
 * @param messageType : const defining messageType (errorMsg,showMsg,hideMsg,debugMsg)
 */
function setMessage(messageStr, messageType) {
  //first some checking and if necessary repairing:
  if (messageStr == null || messageStr == undefined) { //no message:
    messageStr = "No message string supplied to SetMessage!";
  }
  if (messageType == showMsg) { //log message and display message box
    messageDiv.innerHTML = messageStr;
    messageDiv.style.display = "inline"
  } else if (messageType == hideMsg) { //log message and hide messagebox
    messageDiv.innerHTML = messageStr;
    messageDiv.style.display = "none"
  } else if (messageType == errorMsg) { //display Javascript alert
    alert(messageStr)
  }
  if (debugOn) { // in debug mode, all messageTypes logged in console:
    console.log("DEBUG: " + messageStr);
  }
}

